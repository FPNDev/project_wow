const retry = <T>(fn: () => Promise<T>, tries = 3, timeout = 0): Promise<T> => {
  return --tries
    ? fn().catch(() =>
        timeout
          ? new Promise((resolve) =>
              window.setTimeout(
                () => retry(fn, tries, timeout).then(resolve),
                timeout,
              ),
            )
          : retry(fn, tries, timeout),
      )
    : fn();
};

export { retry };
