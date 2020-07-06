import { useCallback } from "react";
import { usePaginatedAPI } from "./usePaginatedAPI";
import Hubs from "@hubs/core";
import { useStore } from "../store/useStore";

export function usePublicRooms() {
  const state = useStore(); // Re-render when you log in/out.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getMoreRooms = useCallback(cursor => Hubs.getPublicRooms(cursor), [state]);
  return usePaginatedAPI(getMoreRooms);
}
