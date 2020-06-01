import { useEffect, useContext, useState } from "react";
import { fetchReticulumAuthenticated } from "../../utils/phoenix-utils";
import { AuthContext } from "../auth/AuthContext";

export function useFeaturedRooms() {
  const auth = useContext(AuthContext);
  const [featuredRooms, setFeaturedRooms] = useState([]);

  useEffect(
    () => {
      const initAsync = async () => {
        // Fetch favorite + public rooms and merge, sorting by member count
        const [favoriteRoomsResult, publicRoomsResult] = await Promise.all([
          auth.isSignedIn
            ? fetchReticulumAuthenticated(`/api/v1/media/search?source=favorites&type=rooms&user=${auth.userId}`)
            : Promise.resolve({ entries: [] }),
          fetchReticulumAuthenticated("/api/v1/media/search?source=rooms&filter=public")
        ]);

        const entries = [...publicRoomsResult.entries, ...favoriteRoomsResult.entries];
        const ids = entries.map(h => h.id);
        const featuredRooms = entries
          .filter((h, i) => ids.lastIndexOf(h.id) === i)
          .sort((a, b) => b.member_count - a.member_count);

        setFeaturedRooms(featuredRooms);
      };

      initAsync();
    },
    [auth.isSignedIn, auth.userId]
  );

  return featuredRooms;
}
