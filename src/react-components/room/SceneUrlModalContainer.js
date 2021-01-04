import React, { useCallback } from "react";
import PropTypes from "prop-types";
import { SceneUrlModal } from "./SceneUrlModal";
import configs from "../../utils/configs";
import { isValidSceneUrl } from "../../utils/scene-url-utils";
import { useIntl } from "react-intl";

export function SceneUrlModalContainer({ hubChannel, onClose }) {
  const intl = useIntl();

  const onValidateUrl = useCallback(
    async url => {
      const valid = await isValidSceneUrl(url.trim());
      return valid || intl.formatMessage("scene-url-modal.invalid-scene-url");
    },
    [intl]
  );

  const onSubmit = useCallback(
    ({ url }) => {
      hubChannel.updateScene(url);
      onClose();
    },
    [hubChannel, onClose]
  );

  return (
    <SceneUrlModal
      enableSpoke={configs.feature("enable_spoke")}
      editorName={configs.translation("editor-name")}
      onValidateUrl={onValidateUrl}
      onSubmit={onSubmit}
      onClose={onClose}
    />
  );
}

SceneUrlModalContainer.propTypes = {
  hubChannel: PropTypes.object.isRequired,
  onClose: PropTypes.func
};
