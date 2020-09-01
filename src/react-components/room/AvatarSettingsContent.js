import React from "react";
import PropTypes from "prop-types";
import { Button } from "../input/Button";
import styles from "./AvatarSettingsContent.scss";
import { TextInputField } from "../input/TextInputField";
import { AvatarPreviewCanvas } from "../avatar/AvatarPreviewCanvas";

export function AvatarSettingsContent({
  displayName,
  onChangeDisplayName,
  avatarPreviewCanvasRef,
  onChangeAvatar,
  onAccept,
  ...rest
}) {
  return (
    <div className={styles.content} {...rest}>
      <TextInputField label="Display Name" value={displayName} onChange={onChangeDisplayName} />
      <div className={styles.avatarPreviewContainer}>
        <AvatarPreviewCanvas ref={avatarPreviewCanvasRef} />
        <Button onClick={onChangeAvatar}>Change Avatar</Button>
      </div>
      <Button preset="accept" onClick={onAccept}>
        Accept
      </Button>
    </div>
  );
}

AvatarSettingsContent.propTypes = {
  className: PropTypes.string,
  displayName: PropTypes.string,
  onChangeDisplayName: PropTypes.func,
  avatarPreviewCanvasRef: PropTypes.object,
  onChangeAvatar: PropTypes.func,
  onAccept: PropTypes.func,
  onBack: PropTypes.func
};
