import {
  StateId,
  EventId,
  StateEvent,
  MachineConfig,
  MachineSnapshot,
  Transition,
} from './types';

export class StateMachine<
  TState extends StateId,
  TContext extends Record<string, any>,
  TEvent extends StateEvent
> {
  private config: MachineConfig<TState, TContext, TEvent>;
  private currentState: TState;
  private currentContext: TContext;
  private stateHistory: TState[] = [];
  private listeners: Set<(snapshot: MachineSnapshot<TState, TContext>) => void> = new Set();

  constructor(config: MachineConfig<TState, TContext, TEvent>) {
    this.config = config;
    this.currentState = config.initial;
    this.currentContext = { ...config.context };
    this.stateHistory.push(this.currentState);
  }

  public getSnapshot(): MachineSnapshot<TState, TContext> {
    return {
      value: this.currentState,
      context: { ...this.currentContext },
      history: [...this.stateHistory],
    };
  }

  public subscribe(listener: (snapshot: MachineSnapshot<TState, TContext>) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public async send(event: TEvent): Promise<boolean> {
    const currentNode = this.config.states[this.currentState];
    if (!currentNode || !currentNode.on) {
      return false;
    }

    const transition = currentNode.on[event.type as TEvent['type']] as
      | Transition<TState, TContext, TEvent>
      | undefined;

    if (!transition) {
      return false; // Event not handled in current state
    }

    // Evaluate Guard predicate
    if (transition.guard) {
      const allowed = await transition.guard(this.currentContext, event);
      if (!allowed) {
        return false;
      }
    }

    // Execute onExit hooks
    if (currentNode.onExit) {
      for (const hook of currentNode.onExit) {
        const update = await hook(this.currentContext, event);
        if (update && typeof update === 'object') {
          this.currentContext = { ...this.currentContext, ...update };
        }
      }
    }

    // Execute transition actions
    if (transition.actions) {
      for (const action of transition.actions) {
        const update = await action(this.currentContext, event);
        if (update && typeof update === 'object') {
          this.currentContext = { ...this.currentContext, ...update };
        }
      }
    }

    // Move to target state
    const previousState = this.currentState;
    this.currentState = transition.target;
    this.stateHistory.push(this.currentState);

    // Execute onEnter hooks of target state
    const targetNode = this.config.states[this.currentState];
    if (targetNode && targetNode.onEnter) {
      for (const hook of targetNode.onEnter) {
        const update = await hook(this.currentContext, event);
        if (update && typeof update === 'object') {
          this.currentContext = { ...this.currentContext, ...update };
        }
      }
    }

    this.notify();
    return true;
  }

  private notify(): void {
    const snap = this.getSnapshot();
    this.listeners.forEach((fn) => fn(snap));
  }
}
