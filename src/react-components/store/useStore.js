import { useContext, useEffect, useState } from "react";
import { SDKContext } from "../sdk/SDKContext";

// Returns the store and causes a re-render whenever the store state changes.
export function useStore() {
  const sdk = useContext(SDKContext);
  const [store, updateStore] = useState(sdk.store);

  useEffect(
    () => {
      const onStoreChanged = () => {
        updateStore(sdk.store);
      };

      sdk.store.addEventListener("statechanged", onStoreChanged);

      return () => {
        sdk.store.removeEventListener("statechanged", onStoreChanged);
      };
    },
    [sdk, updateStore]
  );

  return store;
}
