import { getRoomMetadata, currentRoomKey } from "./room-metadata";

// Returns true if redirect was performed
export function redirectIfNotAuthorized(roomKey) {
  const meta = getRoomMetadata(roomKey); // uses current room if !roomKey
  if (meta['requireLogin'] == false || window.APP.hubChannel.signedIn) {
    return false;
  } else {
    // TODO: Caspian -> put sign in ref here
    location.href = "/";
    return true;
  }
}