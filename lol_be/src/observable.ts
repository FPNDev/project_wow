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

  [Symbol.asyncIterator](): {
    next(): Promise<IteratorResult<T>>;
  };
}

const Observable = <T>(pipes: Pipe<unknown, unknown>[] = []): Observable<T> => {
  const observers: Parameters<Observable<T>['subscribe']>[0][] = [];
  const doneObservers: Parameters<Observable<T>['subscribeDone']>[0][] = [];

  let open: true | void = true;

  const subscribe = (observer: Observer<T>) => {
    let sub: true | void = true;
    observers.push(observer);
    return () => {
      if (!sub) {
        return;
      }
      sub = undefined;
      observers.splice(observers.indexOf(observer), 1);
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

    if (generatorResolve) {
      generatorResolve({ value: pipedData, done: false });
      generatorResolve = undefined;
    }
  }) as Notifier<T>;

  const done = () => {
    if (!open) {
      return;
    }

    open = undefined;
    observers.length = 0;

    let doneObserver: (() => void) | undefined;
    while ((doneObserver = doneObservers.shift())) {
      doneObserver();
    }

    if (generatorResolve) {
      generatorResolve({ value: undefined, done: true });
      generatorResolve = undefined;
    }
  };

  // used to yield items through a generator
  let generatorResolve: ((v: IteratorResult<T>) => void) | void;

  return {
    subscribe,
    subscribeDone,
    notify,
    done,
    pipe: <K>(pipe: Pipe<unknown, unknown>) =>
      Observable<K>([...pipes, pipe]) as Observable<K>,
    get closed() {
      return !open;
    },

    // async / await functionality
    [Symbol.asyncIterator]() {
      return {
        next() {
          return new Promise<IteratorResult<T>>((resolve) => {
            if (!open) {
              // If closed but queue is empty, we're done
              resolve({ value: undefined, done: true });
            } else {
              // Otherwise, wait until `notify()` is called
              generatorResolve = resolve;
            }
          });
        },
      };
    },
  };
};

export { Observable };
