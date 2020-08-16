import { useCallback, useContext } from "react";
import { usePaginatedAPI } from "./usePaginatedAPI";
import { fetchReticulumAuthenticated } from "../../utils/phoenix-utils";
import { AuthContext } from "../auth/AuthContext";

export function usePublicRooms() {
  const auth = useContext(AuthContext); // Re-render when you log in/out.
  const getMoreRooms = useCallback(
    cursor => fetchReticulumAuthenticated(`/api/v1/media/search?source=rooms&filter=public&cursor=${cursor}`),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [auth.isSignedIn]
  );
  return usePaginatedAPI(getMoreRooms);
}
