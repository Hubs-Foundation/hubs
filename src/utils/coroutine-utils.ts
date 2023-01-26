import { coroutine } from "./coroutine";

// TODO Write a better type for coroutine
type Coroutine = () => IteratorResult<undefined, any>;
// TODO: A better type for this
type RollbackFunction = () => void;
export type ClearFunction = () => void;
type JobStartCallback = (
  clear: ClearFunction,
  abortSignal: AbortSignal
) => Generator<Promise<any> | CancelablePromise<any>, any, any>;
export type Job = {
  coroutine?: Coroutine;
  fn: JobStartCallback;
  abortController: AbortController;
  rollbacks: RollbackFunction[];
};

export class JobRunner<T> {
  jobs = new Map<T, Job>();
  pendingStart: Job[] = [];

  add(key: T, fn: JobStartCallback) {
    if (this.jobs.has(key)) {
      throw new Error(`Job already exists for key ${key}`);
    }
    const rollbacks: RollbackFunction[] = [];
    const abortController = new AbortController();
    const job = {
      fn,
      abortController,
      rollbacks
    };
    this.pendingStart.push(job);
    this.jobs.set(key, job);
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
    this.pendingStart.forEach(job => {
      const clear = () => {
        job.rollbacks.length = 0;
      };
      job.coroutine = coroutine(job.fn(clear, job.abortController.signal), job.rollbacks);
    });
    this.pendingStart.length = 0;

    this.jobs.forEach((job, eid) => {
      if (job.coroutine!().done) {
        this.jobs.delete(eid); // TODO Is this safe?
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
