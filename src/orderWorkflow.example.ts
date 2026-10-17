import { StateMachine } from './StateMachine';
import { StateEvent } from './types';

// States
type OrderState =
  | 'idle'
  | 'cart_ready'
  | 'payment_pending'
  | 'paid'
  | 'fulfilled'
  | 'cancelled';

// Context
interface OrderContext {
  orderId: string;
  itemsCount: number;
  totalAmount: number;
  paymentMethod?: string;
  trackingNumber?: string;
}

// Events
type OrderEvents =
  | { type: 'ADD_ITEM'; payload: { price: number } }
  | { type: 'CHECKOUT' }
  | { type: 'PAY'; payload: { method: string; amount: number } }
  | { type: 'PAYMENT_FAILED'; payload: { reason: string } }
  | { type: 'DISPATCH'; payload: { tracking: string } }
  | { type: 'CANCEL'; payload: { reason: string } };

export function createOrderMachine(orderId: string) {
  return new StateMachine<OrderState, OrderContext, OrderEvents>({
    id: `order-machine-${orderId}`,
    initial: 'idle',
    context: {
      orderId,
      itemsCount: 0,
      totalAmount: 0,
    },
    states: {
      idle: {
        on: {
          ADD_ITEM: {
            target: 'cart_ready',
            actions: [
              (ctx, event) => ({
                itemsCount: ctx.itemsCount + 1,
                totalAmount: ctx.totalAmount + event.payload.price,
              }),
            ],
          },
        },
      },
      cart_ready: {
        on: {
          ADD_ITEM: {
            target: 'cart_ready',
            actions: [
              (ctx, event) => ({
                itemsCount: ctx.itemsCount + 1,
                totalAmount: ctx.totalAmount + event.payload.price,
              }),
            ],
          },
          CHECKOUT: {
            target: 'payment_pending',
            guard: (ctx) => ctx.itemsCount > 0 && ctx.totalAmount > 0,
          },
          CANCEL: {
            target: 'cancelled',
          },
        },
      },
      payment_pending: {
        on: {
          PAY: {
            target: 'paid',
            guard: (ctx, event) => event.payload.amount >= ctx.totalAmount,
            actions: [
              (ctx, event) => ({
                paymentMethod: event.payload.method,
              }),
            ],
          },
          PAYMENT_FAILED: {
            target: 'payment_pending',
          },
          CANCEL: {
            target: 'cancelled',
          },
        },
      },
      paid: {
        on: {
          DISPATCH: {
            target: 'fulfilled',
            actions: [
              (ctx, event) => ({
                trackingNumber: event.payload.tracking,
              }),
            ],
          },
        },
      },
      fulfilled: {},
      cancelled: {},
    },
  });
}

// Execution Demo
async function runDemo() {
  console.log('========================================================');
  console.log('   TypeScript Finite State Machine Orchestrator Demo    ');
  console.log('========================================================\n');

  const orderMachine = createOrderMachine('ORD-9942');

  orderMachine.subscribe((snap) => {
    console.log(`[STATE TRANSITION] -> State: \x1b[32m${snap.value}\x1b[0m`);
    console.log(`                   Context:`, snap.context);
  });

  console.log('[*] 1. Adding items to cart...');
  await orderMachine.send({ type: 'ADD_ITEM', payload: { price: 49.99 } });
  await orderMachine.send({ type: 'ADD_ITEM', payload: { price: 89.50 } });

  console.log('\n[*] 2. Initiating Checkout...');
  await orderMachine.send({ type: 'CHECKOUT' });

  console.log('\n[*] 3. Attempting underpayment (should fail guard predicate)...');
  const underpaid = await orderMachine.send({
    type: 'PAY',
    payload: { method: 'Credit Card', amount: 50.0 },
  });
  console.log(`    Underpayment accepted? ${underpaid ? 'YES' : 'NO (Blocked by Guard)'}`);

  console.log('\n[*] 4. Submitting full payment...');
  await orderMachine.send({
    type: 'PAY',
    payload: { method: 'Credit Card', amount: 139.49 },
  });

  console.log('\n[*] 5. Dispatching package to carrier...');
  await orderMachine.send({
    type: 'DISPATCH',
    payload: { tracking: 'TRK-DHL-88741029' },
  });

  console.log('\n[+] Final State Machine Snapshot:');
  console.log(orderMachine.getSnapshot());
}

if (require.main === module) {
  runDemo();
}
