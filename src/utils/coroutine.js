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

function isCancelable(c) {
  return !!c.onCancel;
}

// The thing that has an "onCancel" handler fn.
export function makeCancelable(fn, obj = {}) {
  obj.onCancel = fn;
  return obj;
}

// The thing whose "cancel" function you can call
export function cancelable(iter, signal) {
  const cancelFns = [];
  const rollback = () => {
    for (let i = cancelFns.length - 1; i >= 0; i--) {
      cancelFns[i]();
    }
  };

  let canceled = false;
  signal.onabort = () => {
    rollback();
    canceled = true;
    signal.onabort = null;
  };

  let nextValue;
  let throwing;
  return (function* () {
    while (true) {
      if (canceled) {
        return { canceled: true };
      }
      try {
        const { value, done } = throwing ? iter.throw(nextValue) : iter.next(nextValue);
        throwing = false;
        if (done) {
          signal.onabort = null;
          return { value, canceled: false };
        } else {
          if (isCancelable(value)) {
            cancelFns.push(value.onCancel);
          }
          nextValue = yield value;
        }
      } catch (e) {
        if (throwing) {
          // We already threw back into the iter, rollback and throw ourselves
          rollback();
          throw e;
        } else {
          throwing = true;
          nextValue = e;
        }
      }
    }
  })();
}

function isPromise(p) {
  return p.__proto__ === Promise.prototype;
}

export function coroutine(iter) {
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
      const { value, done } = doThrow ? iter.throw(nextValue) : iter.next(nextValue);
      doThrow = false;
      timers = null;
      if (done) {
        return value;
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
      } else if (isCancelable(value)) {
        nextValue = value;
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
