type Observer<T> = (data: T) => void;

type Observable<T> = {
  subscribe: (observer: Observer<T>) => () => void;
  subscribeDone: (observer: () => void) => void;
  notify: (data: T) => void;
  pipe: <K>(pipe: Observer<unknown>) => Observable<K>;
  done: () => void;
  readonly closed: boolean;
};

const Observable = <T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pipes: Observer<any>[] = [],
): Observable<T> => {
  const observers: Parameters<Observable<T>['subscribe']>[0][] = [];
  const doneObservers: Parameters<Observable<T>['subscribeDone']>[0][] = [];

  let open = true;

  const subscribe = (observer: Observer<T>) => {
    let sub = true;
    observers.push(observer);
    return () => {
      if (!sub) {
        return;
      }
      sub = false;
      observers.splice(observers.indexOf(observer), 1);
    };
  };

  const subscribeDone = (
    observer: Parameters<Observable<T>['subscribeDone']>[0],
  ) => {
    doneObservers.push(observer);
  };

  const notify = (data: T) => {
    if (!open) {
      return;
    }

    const pipedData = pipes.reduce((acc, pipe) => pipe(acc) as T, data) as T;
    for (const observer of observers) {
      observer(pipedData);
    }
  };

  return {
    subscribe,
    subscribeDone,
    notify,
    pipe: <K>(pipe: Observer<K>) => Observable([pipe, ...pipes]),
    done: () => {
      if (!open) {
        return;
      }

      observers.length = 0;
      for (const observer of doneObservers) {
        observer();
      }
      doneObservers.length = 0;
      open = false;
    },
    get closed() {
      return !open;
    },
  };
};

export { Observable };
