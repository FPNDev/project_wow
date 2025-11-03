import { extendObservableWithPipes } from './pipes';

type Observer<T> = (data: T) => void;

class BaseObservable<T> {
  private observers: Observer<T>[] = [];
  private doneObservers: Observer<void>[] = [];
  private open = true;

  private sendToIterators?: (iteratorRes: IteratorResult<T>) => void;

  get closed() {
    return !this.open;
  }

  subscribe(observer: Observer<T>) {
    let subscribed: boolean | undefined;
    if (this.open) {
      subscribed = true;
      this.observers.push(observer);
    }

    return () => {
      if (subscribed) {
        this.observers.splice(this.observers.indexOf(observer), 1);
        subscribed = undefined;
      }
    };
  }
  notify(data: T) {
    if (!this.open) {
      return;
    }

    for (const observer of this.observers) {
      observer(data);
    }

    if (this.sendToIterators) {
      this.sendToIterators({ done: false, value: data });
    }
  }
  subscribeDone(observer: () => void) {
    this.doneObservers.push(observer);
  }
  done() {
    if (!this.open) {
      return;
    }
    this.open = false;
    for (
      let doneIdx = 0, doneLen = this.doneObservers.length;
      doneIdx < doneLen;
      doneIdx++
    ) {
      this.doneObservers[doneIdx]();
    }
    if (this.sendToIterators) {
      this.sendToIterators({ done: true, value: undefined });
    }
    this.doneObservers.length = 0;
    this.observers.length = 0;
  }

  [Symbol.asyncIterator](): {
    next(): Promise<IteratorResult<T>>;
  } {
    const iterator = this.createAsyncIterator();
    return iterator;
  }

  private createAsyncIterator(): {
    next(): Promise<IteratorResult<T>>;
  } {
    return {
      next: (): Promise<IteratorResult<T>> => {
        if (!this.open) {
          return Promise.resolve({ done: true, value: undefined });
        }

        return new Promise((resolve) => {
          const sendToPreviousIterators = this.sendToIterators;
          this.sendToIterators = (iteratorRes: IteratorResult<T>) => {
            resolve(iteratorRes);
            if (sendToPreviousIterators) {
              sendToPreviousIterators(iteratorRes);
            }
          };
        });
      },
    };
  }
}

const Observable = extendObservableWithPipes(BaseObservable);
type Observable<T> = InstanceType<typeof Observable<T>>;

export { Observable };
export type { BaseObservable, Observer };
