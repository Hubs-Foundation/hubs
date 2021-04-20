import { useState, useEffect } from "react";

export default function useAvatar() {
  const [state, setState] = useState({ hasVideoTextureTarget: false });

  useEffect(() => {
    const avatarModelEl = document.querySelector("#avatar-rig .model");

    function onAvatarModelLoaded() {
      const hasVideoTextureTarget = !!avatarModelEl.querySelector("[video-texture-target]");
      setState({ hasVideoTextureTarget });
    }

    onAvatarModelLoaded();

    avatarModelEl.addEventListener("model-loaded", onAvatarModelLoaded);

    return () => {
      avatarModelEl.removeEventListener("model-loaded", onAvatarModelLoaded);
    };
  }, []);

  return state;
}
