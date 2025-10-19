import { extendObservableWithPipes } from './pipes';

type Observer<T> = (data: T) => void;

class BaseObservable<T> {
  private observers: Observer<T>[] = [];
  private doneObservers: Observer<void>[] = [];
  private open = true;

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
    this.doneObservers.length = 0;
    this.observers.length = 0;
  }
}

const Observable = extendObservableWithPipes(BaseObservable);
type Observable<T> = InstanceType<typeof Observable<T>>;

export { Observable };
export type { BaseObservable, Observer };
