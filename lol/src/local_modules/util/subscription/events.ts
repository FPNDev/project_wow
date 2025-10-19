import { SubscriptionPool } from './pool';

type EventListenerOrListenerObject<T extends Event = Event> = (
  evt: T,
) => void | {
  handleEvent(evt: T): void;
};

function extendSubscriptionPoolWithDOMEvents(
  SubscriptionPoolConstructor: new () => SubscriptionPool,
) {
  class EventSubscriptionPool extends SubscriptionPoolConstructor {
    // HTMLElement overloads
    addEvent<K extends keyof HTMLElementEventMap>(
      object: HTMLElement,
      type: K,
      listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => unknown,
      options?: boolean | AddEventListenerOptions,
    ): () => void;

    // Window overloads
    addEvent<K extends keyof WindowEventMap>(
      object: Window,
      type: K,
      listener: (this: Window, ev: WindowEventMap[K]) => unknown,
      options?: boolean | AddEventListenerOptions,
    ): () => void;

    // Document overloads
    addEvent<K extends keyof DocumentEventMap>(
      object: Document,
      type: K,
      listener: (this: Document, ev: DocumentEventMap[K]) => unknown,
      options?: boolean | AddEventListenerOptions,
    ): () => void;

    // Fallback for any generic events

    addEvent<RT extends Event>(
      object: EventTarget,
      type: string,
      listener: EventListenerOrListenerObject<RT>,
      options?: boolean | AddEventListenerOptions,
    ): () => void;

    addEvent(
      object: EventTarget,
      type: string,
      listener: EventListenerOrListenerObject,
      options?: boolean | AddEventListenerOptions,
    ): () => void {
      object.addEventListener(type, listener, options);

      let unsubscribe: (() => void) | undefined = () => {
        if (unsubscribe) {
          object.removeEventListener(type, listener, options);
          this.unsubscribePool.splice(
            this.unsubscribePool.indexOf(unsubscribe),
            1,
          );
          unsubscribe = undefined;
        }
      };
      this.unsubscribePool.push(unsubscribe);

      return unsubscribe;
    }
  }

  return EventSubscriptionPool;
}

export { extendSubscriptionPoolWithDOMEvents };
