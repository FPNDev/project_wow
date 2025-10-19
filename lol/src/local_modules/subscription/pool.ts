import { Observable, Observer } from '../observable/observable';

export class SubscriptionPool {
  protected readonly unsubscribePool: Array<() => void> = [];

  subscribe<T>(observable: Observable<T>, observer: Observer<T>) {
    let unsubscribe: (() => void) | undefined = observable.subscribe(observer);
    this.unsubscribePool.push(unsubscribe);

    return () => {
      if (unsubscribe) {
        const index = this.unsubscribePool.indexOf(unsubscribe);
        if (index !== -1) {
          this.unsubscribePool.splice(index, 1);
        }
        unsubscribe();
        unsubscribe = undefined;
      }
    };
  }

  clear() {
    for (let i = 0, len = this.unsubscribePool.length; i < len; i++) {
      const unsubscribe = this.unsubscribePool[i];
      unsubscribe();
    }

    this.unsubscribePool.length = 0;
  }
}

export const subscriptionPool = () => new SubscriptionPool();
