import { useState, useEffect } from "react";

export default function useAvatar() {
  const [state, setState] = useState({ hasWebcamTextureTarget: false });

  useEffect(() => {
    const avatarModelEl = document.querySelector("#avatar-rig .model");

    function onAvatarModelLoaded() {
      const hasWebcamTextureTarget = !!avatarModelEl.querySelector("[webcam-texture-target]");
      setState({ hasWebcamTextureTarget });
    }

    onAvatarModelLoaded();

    avatarModelEl.addEventListener("model-loaded", onAvatarModelLoaded);

    return () => {
      avatarModelEl.removeEventListener("model-loaded", onAvatarModelLoaded);
    };
  }, []);

  return state;
}
