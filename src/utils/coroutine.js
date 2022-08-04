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
      console.error("Error in generator...");
      console.error(e);
      c.waiting = false;
      c.value = e;
      if (c.stack.length === 1) {
        c.canceled = true;
      } else {
        c.stack.pop();
        c.throw = true;
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
          console.error("Rejected promise...");
          console.error(e);
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
