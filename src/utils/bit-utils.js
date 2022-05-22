import { defineQuery } from "bitecs";

const queries = new Map();
export function anyEntityWith(world, component) {
  if (!queries.has(component)) {
    queries.set(component, defineQuery([component]));
  }

  const eids = queries.get(component)(world);
  return eids.length && eids[0];
}
