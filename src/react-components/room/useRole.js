import { useState, useEffect } from "react";

export function useRole(role, clientId = NAF.clientId) {
  const scene = AFRAME.scenes[0];
  const [hasRole, setHasRole] = useState(APP.hubChannel.presence?.state[clientId]?.metas[0].roles[role]);

  useEffect(() => {
    const onPresenceUpdated = ({ detail: presence }) => {
      if (presence.sessionId !== clientId) return;
      setHasRole(presence.roles[role]);
    };
    scene.addEventListener("presence_updated", onPresenceUpdated);

    return () => {
      scene.removeEventListener("presence_updated", onPresenceUpdated);
    };
  }, [scene, role, setHasRole, clientId]);

  return hasRole;
}
