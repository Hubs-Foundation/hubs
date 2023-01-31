import { isCancelablePromise } from "./coroutine-utils";
let timers;

class CoroutineTimerError extends Error {
  constructor() {
    super();
    this.name = "CoroutineTimerError";
    this.message = "Cannot call coroutine timer functions outside of coroutines.";
  }
}

const nextTimerId = (function () {
  let _i = 0;
  return function () {
    return _i++;
  };
})();

export function crClearTimeout(handle) {
  if (!timers) {
    throw new CoroutineTimerError();
  }
  return timers.delete(handle);
}
export const crClearInterval = crClearTimeout;

export function crTimeout(fn, ms) {
  if (!timers) {
    throw new CoroutineTimerError();
  }
  // TODO: Use world time?
  const now = performance.now();
  const handle = nextTimerId();
  timers.set(handle, { repeat: false, fn, ms, exp: now + ms });
  return handle;
}

export function crInterval(fn, ms) {
  if (!timers) {
    throw new CoroutineTimerError();
  }
  const now = performance.now();
  const handle = nextTimerId();
  timers.set(handle, { repeat: true, fn, ms, exp: now + ms });
  return handle;
}

const nextFramePromise = Promise.resolve();
export function crNextFrame() {
  return nextFramePromise;
}

function isPromise(p) {
  return p.__proto__ === Promise.prototype;
}

export function coroutine(iter, rollbacks) {
  let waiting = false;
  let doThrow = false;
  let nextValue;

  const _timers = new Map();

  const i = (function* () {
    while (true) {
      const now = performance.now();
      _timers.forEach(({ repeat, fn, ms, exp }, handle) => {
        if (now > exp) {
          fn();
          if (repeat) {
            // TODO: Do not create new object every time
            _timers.set(handle, { repeat, fn, exp: exp + ms, ms });
          } else {
            _timers.delete(handle);
          }
        }
      });

      if (waiting) {
        yield;
        continue;
      }
      timers = _timers;
      const v = doThrow ? iter.throw(nextValue) : iter.next(nextValue);
      const done = v.done;
      let value = v.value;

      doThrow = false;
      timers = null;
      if (done) {
        return value;
      }

      if (isCancelablePromise(value)) {
        rollbacks.push(value.rollback);
        value = value.promise;
      }

      if (isPromise(value)) {
        waiting = true;
        value
          .then(v => {
            waiting = false;
            nextValue = v;
          })
          .catch(e => {
            waiting = false;
            doThrow = true;
            nextValue = e;
          });
      } else {
        console.error(`Coroutine yielded value that was not a promise or cancelable.`, value, iter);
        throw new Error(`Coroutine yielded value that was not a promise or cancelable.`);
      }
    }
  })();
  return function () {
    return i.next();
  };
}
