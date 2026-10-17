# ⚡ Strictly-Typed State Machine Orchestrator (TypeScript)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Type Safety: Strict](https://img.shields.io/badge/Type_Safety-Strict-brightgreen)]()

A lightweight, zero-dependency, strictly-typed Finite State Machine (FSM) and asynchronous workflow orchestration engine implemented in **TypeScript**. Provides compile-time transition verification, contextual state guarantees, asynchronous guard predicates, and observable lifecycle subscriptions.

---

## ✨ Features

- **Strict Compile-Time Typing**: Impossible states and invalid event transitions are rejected by TypeScript's static analysis before code ever runs.
- **Asynchronous Guard Predicates**: Condition gates that allow or veto transitions based on business logic and context state.
- **Context Immutability**: Predictable state updates using atomic action callbacks.
- **Lifecycle Action Hooks**: `onEnter` and `onExit` side-effect handlers for state nodes.
- **Observable Subscription Pattern**: Pub/Sub telemetry emitting state snapshots on every atomic transition.
- **Audit History**: Maintains chronological transition tracking for event-sourcing and debugging.

---

## 🏗️ State Transition Diagram (Order Workflow)

```
 [ idle ]
    │
    ▼ (ADD_ITEM)
 [ cart_ready ] ─────────────┐
    │                        │
    ▼ (CHECKOUT)             ▼ (CANCEL)
 [ payment_pending ] ───► [ cancelled ]
    │
    ▼ (PAY with valid amount)
 [ paid ]
    │
    ▼ (DISPATCH)
 [ fulfilled ]
```

---

## 🚀 Quick Start / How to Run

1. Clone the repository:
   ```bash
   git clone https://github.com/juandelgado4-droid/state-machine-orchestrator-ts.git
   cd state-machine-orchestrator-ts
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Compile and execute the demo workflow:
   ```bash
   npm run demo
   ```

---

## 💻 Sample Code

```typescript
const machine = new StateMachine<OrderState, OrderContext, OrderEvents>({
  id: 'order-fsm',
  initial: 'idle',
  context: { total: 0 },
  states: {
    idle: {
      on: {
        ADD_ITEM: {
          target: 'cart_ready',
          actions: [(ctx, event) => ({ total: ctx.total + event.payload.price })]
        }
      }
    },
    // ...
  }
});

// Send typed event:
await machine.send({ type: 'ADD_ITEM', payload: { price: 49.99 } });
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
