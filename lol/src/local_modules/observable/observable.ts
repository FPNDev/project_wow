type Observer<T> = (data: T) => void;
type Pipe<T, K> = (data: T) => K;

interface Notifier<T> {
  (arg: T extends void ? Partial<T> : T): void;
}

interface Observable<T> {
  subscribe: (observer: Observer<T>) => () => void;
  subscribeDone: (observer: () => void) => void;
  pipe: <K>(pipe: Pipe<unknown, unknown>) => Observable<K>;
  notify: Notifier<T>;
  done: () => void;
  readonly closed: boolean;
}

const Observable = <T>(pipes: Pipe<unknown, unknown>[] = []): Observable<T> => {
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

  const notify = ((data: T) => {
    if (!open) {
      return;
    }

    const pipedData = pipes.reduce(
      (acc: unknown, pipe) => pipe(acc) as unknown,
      data
    ) as T;
    for (const observer of observers) {
      observer(pipedData);
    }
  }) as Notifier<T>;

  return {
    subscribe,
    subscribeDone,
    notify,
    pipe: <K>(pipe: Pipe<unknown, unknown>) =>
      Observable<K>([...pipes, pipe]) as Observable<K>,
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
