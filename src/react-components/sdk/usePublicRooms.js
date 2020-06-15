import { useCallback } from "react";
import { usePaginatedAPI } from "./usePaginatedAPI";
import Hubs from "@hubs/core";
import { useStoreStateChange } from "../store/useStoreStateChange";

export function usePublicRooms() {
  const state = useStoreStateChange(); // Re-render when you log in/out.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getMoreRooms = useCallback(cursor => Hubs.getPublicRooms(cursor), [state]);
  return usePaginatedAPI(getMoreRooms);
}
