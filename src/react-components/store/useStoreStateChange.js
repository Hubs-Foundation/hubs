import { useEffect, useState } from "react";
import Hubs from "@hubs/core";

// Causes a re-render whenever the store state changes.
export function useStoreStateChange() {
  const [state, forceUpdate] = useState({ store: Hubs.store });

  useEffect(
    () => {
      const onStoreChanged = () => {
        forceUpdate({ store: Hubs.store });
      };

      Hubs.store.addEventListener("statechanged", onStoreChanged);

      return () => {
        Hubs.store.removeEventListener("statechanged", onStoreChanged);
      };
    },
    [forceUpdate]
  );

  return state;
}
