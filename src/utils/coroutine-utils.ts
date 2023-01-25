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
