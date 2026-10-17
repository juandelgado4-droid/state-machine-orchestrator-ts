/**
 * Core type definitions for Strictly-Typed Finite State Machine (FSM)
 */

export type StateId = string;
export type EventId = string;

export interface StateEvent<TType extends EventId = EventId, TPayload = any> {
  type: TType;
  payload?: TPayload;
}

export type GuardPredicate<TContext, TEvent extends StateEvent> = (
  context: TContext,
  event: TEvent
) => boolean | Promise<boolean>;

export type ActionCallback<TContext, TEvent extends StateEvent> = (
  context: TContext,
  event: TEvent
) => void | Partial<TContext> | Promise<void | Partial<TContext>>;

export interface Transition<TState extends StateId, TContext, TEvent extends StateEvent> {
  target: TState;
  guard?: GuardPredicate<TContext, TEvent>;
  actions?: ActionCallback<TContext, TEvent>[];
}

export interface StateNode<TState extends StateId, TContext, TEvent extends StateEvent> {
  on?: {
    [E in TEvent['type']]?: Transition<TState, TContext, Extract<TEvent, { type: E }>>;
  };
  onEnter?: ActionCallback<TContext, TEvent>[];
  onExit?: ActionCallback<TContext, TEvent>[];
}

export interface MachineConfig<TState extends StateId, TContext, TEvent extends StateEvent> {
  id: string;
  initial: TState;
  context: TContext;
  states: {
    [S in TState]: StateNode<TState, TContext, TEvent>;
  };
}

export interface MachineSnapshot<TState extends StateId, TContext> {
  value: TState;
  context: TContext;
  history: TState[];
}
