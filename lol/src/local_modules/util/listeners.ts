class ListenerGroup {
  listeners: [
    EventTarget,
    string,
    EventListenerOrEventListenerObject,
    boolean | AddEventListenerOptions | undefined,
  ][] = [];

  // HTMLElement overloads
  add<K extends keyof HTMLElementEventMap>(
    object: HTMLElement,
    type: K,
    listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions,
  ): void;

  // Window overloads
  add<K extends keyof WindowEventMap>(
    object: Window,
    type: K,
    listener: (this: Window, ev: WindowEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions,
  ): void;

  // Document overloads
  add<K extends keyof DocumentEventMap>(
    object: Document,
    type: K,
    listener: (this: Document, ev: DocumentEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions,
  ): void;

  // Generic fallback for custom events or any EventTarget
  add(
    object: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;

  // Implementation (must be last)
  add(
    object: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void {
    object.addEventListener(type, listener, options);
    this.listeners.push([object, type, listener, options]);
  }

  stopAll() {
    for (let i = 0; i < this.listeners.length; i++) {
      const [object, type, listener, options] = this.listeners[i];
      object.removeEventListener(type, listener, options);
    }

    this.listeners = [];
  }
}

export const listenerGroup = () => new ListenerGroup();
