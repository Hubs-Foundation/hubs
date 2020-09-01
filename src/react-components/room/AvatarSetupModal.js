import React from "react";
import PropTypes from "prop-types";
import { Modal } from "../modal/Modal";
import { Button } from "../input/Button";
import { ReactComponent as ChevronBackIcon } from "../icons/ChevronBack.svg";
import styles from "./AvatarSetupModal.scss";
import { IconButton } from "../input/IconButton";
import { TextInputField } from "../input/TextInputField";
import { AvatarPreviewCanvas } from "../avatar/AvatarPreviewCanvas";

export function AvatarSetupModal({
  className,
  displayName,
  onChangeDisplayName,
  avatarPreviewCanvasRef,
  onChangeAvatar,
  onAccept,
  onBack,
  ...rest
}) {
  return (
    <Modal
      title="Avatar Setup"
      beforeTitle={
        <IconButton onClick={onBack}>
          <ChevronBackIcon />
          <span>Back</span>
        </IconButton>
      }
      className={className}
      contentClassName={styles.content}
      {...rest}
    >
      <TextInputField label="Display Name" value={displayName} onChange={onChangeDisplayName} />
      <div className={styles.avatarPreviewContainer}>
        <AvatarPreviewCanvas ref={avatarPreviewCanvasRef} />
        <Button onClick={onChangeAvatar}>Change Avatar</Button>
      </div>
      <Button preset="accept" onClick={onAccept}>
        Accept
      </Button>
    </Modal>
  );
}

AvatarSetupModal.propTypes = {
  className: PropTypes.string,
  displayName: PropTypes.string,
  onChangeDisplayName: PropTypes.func,
  avatarPreviewCanvasRef: PropTypes.object,
  onChangeAvatar: PropTypes.func,
  onAccept: PropTypes.func,
  onBack: PropTypes.func
};
