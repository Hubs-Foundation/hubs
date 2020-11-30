import React, { useCallback } from "react";
import PropTypes from "prop-types";
import { AvatarUrlModal } from "./AvatarUrlModal";

export function AvatarUrlModalContainer({ store, scene, onClose }) {
  const onSubmit = useCallback(
    ({ url }) => {
      store.update({ profile: { ...store.state.profile, ...{ avatarId: url } } });
      scene.emit("avatar_updated");
      onClose();
    },
    [store, scene, onClose]
  );

  return <AvatarUrlModal onSubmit={onSubmit} onClose={onClose} />;
}

AvatarUrlModalContainer.propTypes = {
  store: PropTypes.object.isRequired,
  scene: PropTypes.object.isRequired,
  onClose: PropTypes.func
};
