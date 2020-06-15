import { useCallback } from "react";
import { usePaginatedAPI } from "./usePaginatedAPI";
import { useStoreStateChange } from "../store/useStoreStateChange";
import Hubs from "@hubs/core";

export function useFavoriteRooms() {
  const state = useStoreStateChange(); // Re-render when you log in/out.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getMoreRooms = useCallback(cursor => Hubs.getFavoriteRooms(cursor), [state]);
  return usePaginatedAPI(getMoreRooms);
}
