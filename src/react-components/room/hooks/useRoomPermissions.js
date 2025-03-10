import { useState, useEffect } from "react";

export function useRoomPermissions() {
  const [roomPermissions, setRoomPermissions] = useState(APP.hub.member_permissions);

  useEffect(() => {
    const onPermissionsUpdated = () => {
      setRoomPermissions(APP.hub.member_permissions);
    };
    APP.hubChannel.addEventListener("permissions_updated", onPermissionsUpdated);

    return () => {
      APP.hubChannel.removeEventListener("permissions_updated", onPermissionsUpdated);
    };
  }, [roomPermissions, setRoomPermissions]);

  return {
    ...roomPermissions
  };
}
