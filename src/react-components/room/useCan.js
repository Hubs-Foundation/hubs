import { useState, useEffect } from "react";

export function useCan(permission) {
  const [can, setCan] = useState(APP.hubChannel.can(permission));

  useEffect(
    () => {
      const onPermissionsUpdated = () => {
        setCan(APP.hubChannel.can(permission));
      };
      APP.hubChannel.addEventListener("permissions_updated", onPermissionsUpdated);

      return () => {
        APP.hubChannel.removeEventListener("permissions_updated", onPermissionsUpdated);
      };
    },
    [permission, setCan]
  );

  return {
    can
  };
}
