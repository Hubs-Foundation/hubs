import { usePaginatedAPI } from "./usePaginatedAPI";
import { useSDK } from "./useSDK";
import { useStore } from "../store/useStore";
import { useCallback } from "react";

export function useFavoriteRooms() {
  const sdk = useSDK();
  useStore(); // Re-render when you log in/out.
  const getMoreRooms = useCallback(cursor => sdk.getFavoriteRooms(cursor), [sdk]);
  return usePaginatedAPI(getMoreRooms);
}
