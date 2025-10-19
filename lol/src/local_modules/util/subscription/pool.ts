import { Observable, Observer } from '../../observable/observable';
import { extendSubscriptionPoolWithDOMEvents } from './events';

export class SubscriptionPool {
  protected readonly unsubscribePool: Array<() => void> = [];

  subscribe<T>(observable: Observable<T>, observer: Observer<T>) {
    const unsubscribe = observable.subscribe(observer);
    this.unsubscribePool.push(unsubscribe);
  }

  clear() {
    for (let i = 0, len = this.unsubscribePool.length; i < len; i++) {
      const unsubscribe = this.unsubscribePool[i];
      unsubscribe();
    }

    this.unsubscribePool.length = 0;
  }
}

const EventSubscriptionPool =
  extendSubscriptionPoolWithDOMEvents(SubscriptionPool);

export const subscriptionPool = () => new SubscriptionPool();
export const eventSubscriptionPool = () => new EventSubscriptionPool();
