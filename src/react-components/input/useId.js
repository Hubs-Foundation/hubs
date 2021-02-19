import { useState } from "react";

const idPrefix = "id_";

let nextId = 0;

// Note: React 17 introduced the experimental unstable_useOpaqueIdentifier hook. We'll want to switch to this in the future.
export function useId() {
  const [id] = useState(() => idPrefix + nextId++);
  return id;
}
