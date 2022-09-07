const preloads: Promise<any>[] = [];

export function waitForPreloads() {
  return Promise.all(preloads);
}

export function preload<T>(p: Promise<T>) {
  preloads.push(p);
}
