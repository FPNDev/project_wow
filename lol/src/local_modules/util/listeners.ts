import { Observable } from '../observable/observable';

class EventSystem {
  removeEventListenerFns: Array<() => void> = [];

  // HTMLElement overloads
  add<K extends keyof HTMLElementEventMap>(
    object: HTMLElement,
    type: K,
    listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions
  ): () => void;

  // Window overloads
  add<K extends keyof WindowEventMap>(
    object: Window,
    type: K,
    listener: (this: Window, ev: WindowEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions
  ): () => void;

  // Document overloads
  add<K extends keyof DocumentEventMap>(
    object: Document,
    type: K,
    listener: (this: Document, ev: DocumentEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions
  ): () => void;

  // Generic fallback for custom events or any EventTarget
  add(
    object: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): () => void;

  add(
    object: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): () => void {
    object.addEventListener(type, listener, options);

    let unsubscribe: (() => void) | undefined = () => {
      if (unsubscribe) {
        object.removeEventListener(type, listener, options);
        this.removeEventListenerFns.splice(
          this.removeEventListenerFns.indexOf(unsubscribe),
          1
        );
        unsubscribe = undefined;
      }
    };
    this.removeEventListenerFns.push(unsubscribe);

    return unsubscribe;
  }

  fromEvent<T extends Event = Event>(
    object: EventTarget,
    type: string,
    options?: boolean | AddEventListenerOptions,
    useObservable?: Observable<T>
  ): Observable<T> {
    const observable = useObservable ?? Observable<T>();
    const handler = (e: T) => {
      observable.notify(e);
    };

    const unsubscribeFromEvent = this.add(
      object,
      type,
      handler as EventListener,
      options
    );

    observable.subscribeDone(() => {
      unsubscribeFromEvent();
    });

    return observable;
  }

  stopAll() {
    for (let i = 0, len = this.removeEventListenerFns.length; i < len; i++) {
      const unsubscribe = this.removeEventListenerFns[i];
      unsubscribe();
    }

    this.removeEventListenerFns.length = 0;
  }
}

export const eventSystem = () => new EventSystem();
