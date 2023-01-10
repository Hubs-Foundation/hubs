import { useState, useEffect } from "react";

export function useCan(permission) {
  const [canDo, setCanDo] = useState(APP.hubChannel.can(permission));

  useEffect(() => {
    const onPermissionsUpdated = () => setCanDo(APP.hubChannel.can(permission));
    APP.hubChannel.addEventListener("permissions_updated", onPermissionsUpdated);

    return () => {
      APP.hubChannel.removeEventListener("permissions_updated", onPermissionsUpdated);
    };
  }, [permission, setCanDo]);

  return canDo;
}
