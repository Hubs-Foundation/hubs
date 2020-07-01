import { useCallback, useState, useRef } from "react";
import Hubs from "@hubs/core";

export function useCreateAndRedirectToRoom(params) {
  // Use a ref so createRoom can't be called when already creating a room
  // and so that createRoom doesn't change when creatingRoom changes.

  const creatingRoomRef = useRef(false);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [error, setError] = useState();

  const createRoom = useCallback(
    () => {
      if (creatingRoomRef.current) {
        return;
      }

      setCreatingRoom(true);
      creatingRoomRef.current = true;

      Hubs.createRoom(params)
        .then(({ url }) => {
          window.location = url;
        })
        .catch(error => {
          console.error(`Error creating room: ${error}`);
          setError(error);
          setCreatingRoom(false);
          creatingRoomRef.current = false;
        });
    },
    [setError, setCreatingRoom, params]
  );

  return { creatingRoom, error, createRoom };
}
