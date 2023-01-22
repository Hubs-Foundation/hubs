const preloads: Promise<any>[] = [];

export function waitForPreloads() {
  return Promise.all(preloads);
}

export function preload<T>(p: Promise<T>) {
  preloads.push(p);
}

export function repeatUntilTrue(predicate: () => boolean) {
  let resolve: (arg?: any) => void;
  const promise = new Promise(function (r) {
    resolve = r;
  });

  const interval = setInterval(function () {
    if (predicate()) {
      clearInterval(interval);
      resolve!();
    }
  }, 0);

  return promise;
}
