export function touchIsAssigned(touch, assignments) {
  return (
    assignments.find(assignment => {
      return assignment.touch.identifier === touch.identifier;
    }) !== undefined
  );
}

export function jobIsAssigned(job, assignments) {
  return (
    assignments.find(assignment => {
      return assignment.job === job;
    }) !== undefined
  );
}

export function assign(touch, job, assignments) {
  if (touchIsAssigned(touch, assignments) || jobIsAssigned(job, assignments)) {
    console.error("cannot reassign touches or jobs. unassign first");
    return undefined;
  }
  const assignment = { job, touch };
  assignments.push(assignment);
  return assignment;
}

export function unassign(touch, job, assignments) {
  function match(assignment) {
    return assignment.touch.identifier === touch.identifier && assignment.job === job;
  }
  assignments.splice(assignments.findIndex(match), 1);
}

export function findByJob(job, assignments) {
  return assignments.find(assignment => {
    return assignment.job === job;
  });
}

export function findByTouch(touch, assignments) {
  return assignments.find(assignment => {
    return assignment.touch.identifier === touch.identifier;
  });
}
