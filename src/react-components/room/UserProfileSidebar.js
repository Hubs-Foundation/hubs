import React from "react";
import PropTypes from "prop-types";
import { Sidebar } from "../sidebar/Sidebar";
import { ReactComponent as ChevronBackIcon } from "../icons/ChevronBack.svg";
import { IconButton } from "../input/IconButton";
import { Button } from "../input/Button";
import styles from "./UserProfileSidebar.scss";
import { AvatarPreviewCanvas } from "../avatar/AvatarPreviewCanvas";

export function UserProfileSidebar({
  className,
  displayName,
  avatarPreviewCanvasRef,
  canPromote,
  onPromote,
  canHide,
  onHide,
  canMute,
  onMute,
  canKick,
  onKick,
  onBack,
  ...rest
}) {
  return (
    <Sidebar
      title={displayName}
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
      <AvatarPreviewCanvas ref={avatarPreviewCanvasRef} />
      {canPromote && (
        <Button preset="green" onClick={onPromote}>
          Promote
        </Button>
      )}
      {canHide && <Button onClick={onHide}>Hide</Button>}
      {canMute && (
        <Button preset="red" onClick={onMute}>
          Mute
        </Button>
      )}
      {canKick && (
        <Button preset="red" onClick={onKick}>
          Kick
        </Button>
      )}
    </Sidebar>
  );
}

UserProfileSidebar.propTypes = {
  className: PropTypes.string,
  displayName: PropTypes.string,
  avatarPreviewCanvasRef: PropTypes.object,
  canPromote: PropTypes.bool,
  onPromote: PropTypes.func,
  canHide: PropTypes.bool,
  onHide: PropTypes.func,
  canMute: PropTypes.bool,
  onMute: PropTypes.func,
  canKick: PropTypes.bool,
  onKick: PropTypes.func,
  onBack: PropTypes.func
};
