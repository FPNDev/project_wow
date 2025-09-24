type ProtoWithEventListeners = {
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: object,
  ): void;
};

class ListenerGroup {
  listeners: [
    ProtoWithEventListeners,
    string,
    EventListenerOrEventListenerObject,
    object,
  ][] = [];

  add(
    object: ProtoWithEventListeners,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void {
    object.addEventListener(type, listener, options);
    this.listeners.push([object, type, listener, object]);
  }

  stopAll() {
    for (let i = 0; i < this.listeners.length; i++) {
      const [object, type, listener, context] = this.listeners[i];
      object.removeEventListener(type, listener, context);
    }

    this.listeners = [];
  }
}

export const listenerGroup = () => new ListenerGroup();
