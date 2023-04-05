import { coroutine } from "./coroutine";

// TODO Write a better type for coroutine
type Coroutine = () => IteratorResult<undefined, any>;
// TODO: A better type for this
type RollbackFunction = () => void;
export type ClearFunction = () => void;
type JobStartCallback = (
  clearRollbacks: ClearFunction,
  abortSignal: AbortSignal
) => Generator<Promise<any> | CancelablePromise<any>, any, any>;
export type Job = {
  coroutine?: Coroutine;
  startCallback: JobStartCallback;
  abortController: AbortController;
  rollbacks: RollbackFunction[];
};

export class JobRunner<T> {
  jobs = new Map<T, Job>();

  add(key: T, startCallback: JobStartCallback) {
    if (this.jobs.has(key)) {
      throw new Error(`Job already exists for key ${key}`);
    }
    this.jobs.set(key, {
      startCallback,
      abortController: new AbortController(),
      rollbacks: []
    });
  }

  has(key: T) {
    return this.jobs.has(key);
  }

  stop(key: T) {
    const job = this.jobs.get(key);
    if (!job) return false;
    job.abortController.abort();
    for (let i = job.rollbacks.length - 1; i >= 0; i--) {
      job.rollbacks[i]();
    }
    this.jobs.delete(key);
    return true;
  }

  tick() {
    this.jobs.forEach((job, eid) => {
      if (!job.coroutine) {
        const clearRollbacks = () => {
          job.rollbacks.length = 0;
        };
        job.coroutine = coroutine(job.startCallback(clearRollbacks, job.abortController.signal), job.rollbacks);
      }

      if (job.coroutine!().done) {
        this.jobs.delete(eid);
      }
    });
  }
}

const $rollbackSymbol = Symbol("rollback");
class CancelablePromise<T> {
  promise: Promise<T>;
  rollback: RollbackFunction;
  $rollback = $rollbackSymbol;
  constructor(promise: Promise<T>, rollback: RollbackFunction) {
    this.promise = promise;
    this.rollback = rollback;
  }
}

export function isCancelablePromise<T>(c: any): c is CancelablePromise<T> {
  return c.$rollback === $rollbackSymbol;
}

export function withRollback<T>(promise: Promise<T>, rollback: RollbackFunction) {
  return new CancelablePromise(promise, rollback);
}
