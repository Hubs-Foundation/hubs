import { useState, useEffect } from "react";

export function usePermissions() {
  const [permissions, setPermissions] = useState(APP.hubChannel._permissions);

  useEffect(() => {
    const onPermissionsUpdated = () => {
      setPermissions(APP.hubChannel._permissions);
    };
    APP.hubChannel.addEventListener("permissions_updated", onPermissionsUpdated);

    return () => {
      APP.hubChannel.removeEventListener("permissions_updated", onPermissionsUpdated);
    };
  }, [permissions, setPermissions]);

  return {
    ...permissions
  };
}
