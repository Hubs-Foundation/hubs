import { useCallback } from "react";
import { usePaginatedAPI } from "./usePaginatedAPI";
import { useSDK } from "./useSDK";
import { useStore } from "../store/useStore";

export function usePublicRooms() {
  const sdk = useSDK();
  useStore(); // Re-render when you log in/out.
  const getMoreRooms = useCallback(cursor => sdk.getPublicRooms(cursor), [sdk]);
  return usePaginatedAPI(getMoreRooms);
}
