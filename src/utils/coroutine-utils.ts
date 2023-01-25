import { EntityID } from "./networking-types";

// TODO Write a better type for coroutine
type Coroutine = () => IteratorResult<undefined, any>;
export type Job = {
  coroutine: Coroutine;
  abortController?: AbortController;
};

export type JobMap = Map<EntityID, Job>;

export function startJob(jobs: JobMap, eid: EntityID, coroutine: Coroutine) {
  jobs.set(eid, { coroutine });
}

export function stopJob(jobs: JobMap, eid: EntityID) {
  const job = jobs.get(eid);
  if (!job) return;
  if (job.abortController) {
    job.abortController.abort();
  }
  jobs.delete(eid);
}

export function tickJobs(jobs: JobMap) {
  jobs.forEach((job, eid) => {
    if (job.coroutine().done) {
      jobs.delete(eid);
    }
  });
}

export function hasCancelHandler(c: any) {
  return !!c.onCancel;
}

export function withRollback(fn: RollbackFunction, obj = {}) {
  (obj as any).onCancel = fn;
  return obj;
}

// TODO: A better type for this
type CancelableGenerator = Generator<any, any, any>;
type RollbackFunction = () => void;
// The thing whose "cancel" function you can call
export function cancelable(job: Job, iter: Generator) {
  if (job.abortController) throw new Error("Nesting cancellables is not allowed.");
  job.abortController = new AbortController();

  const rollbackFns: RollbackFunction[] = [];
  const rollback = () => {
    for (let i = rollbackFns.length - 1; i >= 0; i--) {
      rollbackFns[i]();
    }
  };

  let canceled = false;
  job.abortController.signal.onabort = () => {
    rollback();
    canceled = true;
    job.abortController!.signal.onabort = null;
  };

  let nextValue: any;
  let throwing;
  return (function* (): CancelableGenerator {
    while (true) {
      if (canceled) {
        throw new Error("It is invalid to tick a canceled coroutine.");
      }
      try {
        const { value, done }: { value?: any; done?: boolean } = (
          throwing ? iter.throw(nextValue) : iter.next(nextValue)
        ) as { value?: any; done?: boolean };
        throwing = false;
        if (done) {
          job.abortController!.signal.onabort = null;
          delete job.abortController;
          return value;
        } else {
          if (hasCancelHandler(value)) {
            rollbackFns.push(value.onCancel);
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
