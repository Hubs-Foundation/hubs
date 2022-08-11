function isCancellable(c) {
  return !!c.onCancel;
}

function isPromise(p) {
  return p.__proto__ === Promise.prototype;
}

function isGenerator(fn) {
  return fn.__proto__.__proto__.toString() === "[object Generator]";
}

export function createCoroutine(generator) {
  return {
    waiting: false,
    done: false,
    cancelFns: [],
    value: null,
    stack: [generator]
  };
}

export function runCoroutine(c) {
  if (c.done || c.stack.length === 0) {
    throw new Error("Called coroutine that was already done.");
  }

  while (true) {
    if (c.canceled) {
      for (let i = c.cancelFns.length - 1; i >= 0; i--) {
        c.cancelFns[i]();
      }
      c.done = true;
      if (c.throw) {
        // We are canceling due to an uncaught error.
        // Do not re-throw, but log the error to the
        // console so that it's not lost.
        console.error(c.value);
      }
      return c;
    }

    if (c.waiting) return c;

    if (c.stack.length === 0) {
      c.done = true;
      return c;
    }

    let next;
    try {
      if (c.throw) {
        c.throw = false;
        next = c.stack[c.stack.length - 1].throw(c.value);
      } else {
        next = c.stack[c.stack.length - 1].next(c.value);
      }
    } catch (e) {
      // Generator throws
      // console.error(e);
      c.waiting = false;
      c.value = e;
      c.throw = true;
      if (c.stack.length === 1) {
        c.canceled = true;
      } else {
        c.stack.pop();
      }
      return c;
    }

    let value = next.value;

    if (value && isCancellable(value)) {
      c.cancelFns.push(value.onCancel);
      value = value.value;
    }

    if (next.done) {
      c.stack.pop();
      c.value = value;
      continue;
    }

    if (value && isPromise(value)) {
      c.waiting = true;
      value
        .then(v => {
          c.waiting = false;
          c.value = v;
          return v;
        })
        .catch(e => {
          c.waiting = false;
          c.throw = true;
          c.value = e;
        });
      return c;
    } else if (value && isGenerator(value)) {
      c.stack.push(value);
    } else {
      c.value = value;
    }
  }
}

// Run multiple coroutines in a sequence.
// Canceling the chain will cancel only the current coroutine.
export function* chain(generators) {
  let c;
  const onCancel = () => {
    if (c) {
      // console.log("Chain canceled!");
      c.canceled = true;
    }
  };
  // Yield a cancelable that can cancel the active coroutine
  yield { value: null, onCancel };
  c = createCoroutine(generators[0]());
  // console.log("First coroutine is for...", c.stack[0]);
  let i = 0;
  while (true) {
    runCoroutine(c);
    if (c.done) {
      if (c.canceled) {
        // console.warn("Early exit from chain.");
        break;
      }

      if (i === generators.length - 1) {
        // console.log("Normal exit from chain.");
        break;
      }

      i += 1;
      c = createCoroutine(generators[i](c.value));
      // console.log("Next coroutine is for...", c.stack[0]);
    } else {
      yield Promise.resolve();
    }
  }
  // console.log("Done!");
}
