const retry = <T>(fn: () => Promise<T>, tries = 3, timeout = 0): Promise<T> => {
  return --tries
    ? fn().catch(() =>
        timeout
          ? new Promise((resolve) =>
              window.setTimeout(
                () => resolve(retry(fn, tries, timeout)),
                timeout,
              ),
            )
          : retry(fn, tries, timeout),
      )
    : fn();
};
