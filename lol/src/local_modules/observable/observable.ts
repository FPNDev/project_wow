type Observer<T> = (data: T) => void;
type Pipe<T, K> = (data: T) => K | Promise<K>;

interface Notifier<T> {
  (data: T): void;
}

interface Observable<T> {
  subscribe: (observer: Observer<T>) => () => void;
  subscribeDone: (observer: () => void) => void;
  pipe: <K>(pipe: Pipe<T, K>) => Observable<K>;
  notify: Notifier<T>;
  done: () => void;
  readonly closed: boolean;
}

const Observable = <T>(
  pipes?: [...Pipe<unknown, unknown>[], Pipe<unknown, T>]
): Observable<T> => {
  const observers: Parameters<Observable<T>['subscribe']>[0][] = [];
  const doneObservers: Parameters<Observable<T>['subscribeDone']>[0][] = [];

  let open = true;

  const subscribe = (observer: Observer<T>) => {
    observers.push(observer);
    return () => {
      const idx = observers.indexOf(observer);
      if (idx !== -1) {
        observers.splice(idx, 1);
      }
    };
  };

  const subscribeDone = (
    observer: Parameters<Observable<T>['subscribeDone']>[0]
  ) => {
    doneObservers.push(observer);
  };

  const notify = async (data: T) => {
    if (!open) {
      return;
    }

    let pipedData: unknown = data;
    if (pipes) {
      for (let i = 0, pipesLen = pipes.length; open && i < pipesLen; i++) {
        pipedData = pipes[i](pipedData);
        if (pipedData instanceof Promise) {
          pipedData = await pipedData;
        }
      }
    }

    // Check if still open after async pipes
    if (!open) {
      return;
    }

    for (const observer of observers) {
      observer(<T>pipedData);
    }
  };

  return {
    subscribe,
    subscribeDone,
    notify,
    pipe: <K>(pipe: Pipe<T, K>) =>
      Observable<K>([...(pipes ?? []), pipe as Pipe<unknown, K>]),
    done: () => {
      if (!open) {
        return;
      }

      open = false;
      observers.length = 0;

      let doneObserver: (() => void) | undefined;
      while ((doneObserver = doneObservers.shift())) {
        doneObserver();
      }
    },
    get closed() {
      return !open;
    },
  };
};

export { Observable };
