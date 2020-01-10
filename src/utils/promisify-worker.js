// Wrapper for a worker which accepts work items and responds with results.
//
// The worker must receive messages with data of the shape { id, payload }, and then respond
// with messages containing matching IDs of the shape { id, result, err }.
//
// Returns a function that accepts a work item, sends it to the worker, and returns a promise that
// will resolve with the result or reject with the error.
//
export function promisifyWorker(worker) {
  let nextItemId = 0;
  const outstanding = {}; // item ID: { resolve, reject }

  worker.onmessage = msg => {
    const { id, result, err } = msg.data;
    const handlers = outstanding[id];
    if (handlers == null) {
      console.error(`Unknown message with ID ${id} received from ${worker}.`);
    } else {
      delete outstanding[id];
      if (err != null) {
        handlers.reject(new Error(err));
      } else {
        handlers.resolve(result);
      }
    }
  };

  return function(data, transfer, args = {}) {
    const id = nextItemId++;
    const promise = new Promise((resolve, reject) => {
      outstanding[id] = { resolve, reject };
    });
    worker.postMessage(Object.assign(args, { id, payload: data }), transfer);
    return promise;
  };
}
