import React, { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { ReactComponent as VideoIcon } from "../icons/Video.svg";
import { ReactComponent as DesktopIcon } from "../icons/Desktop.svg";
import { ReactComponent as AvatarIcon } from "../icons/Avatar.svg";
import { SharePopoverButton } from "./SharePopover";
import { FormattedMessage } from "react-intl";
import useAvatar from "./hooks/useAvatar";
import { MediaDevicesEvents, MediaDevices } from "../../utils/media-devices-utils";

function useShare(scene, hubChannel) {
  const mediaDevicesManager = APP.mediaDevicesManager;
  const [sharingSource, setSharingSource] = useState(null);
  const [canShareCamera, setCanShareCamera] = useState(false);
  const [canShareScreen, setCanShareScreen] = useState(false);
  const [canShareCameraToAvatar, setCanShareCameraToAvatar] = useState(false);
  const { hasVideoTextureTarget } = useAvatar();

  useEffect(() => {
    function onShareVideoEnabled(event) {
      setSharingSource(event.detail.source);
    }

    function onShareVideoDisabled() {
      setSharingSource(null);
    }

    function onPermissionsUpdated() {
      const canShareMedia = hubChannel.can("spawn_and_move_media");

      if (canShareMedia) {
        navigator.mediaDevices
          .enumerateDevices()
          .then(devices => {
            const hasCamera = devices.some(device => device.kind === "videoinput");
            setCanShareCamera(hasCamera);
            setCanShareCameraToAvatar(hasCamera && hasVideoTextureTarget);
          })
          .catch(() => {
            setCanShareCamera(false);
            setCanShareCameraToAvatar(false);
          });

        setCanShareScreen(!!navigator.mediaDevices.getDisplayMedia);
      } else {
        setCanShareScreen(false);
        setCanShareCamera(false);
        setCanShareCameraToAvatar(false);
      }
    }

    scene.addEventListener("share_video_enabled", onShareVideoEnabled);
    scene.addEventListener("share_video_disabled", onShareVideoDisabled);
    // TODO: Show share error dialog
    scene.addEventListener("share_video_failed", onShareVideoDisabled);
    hubChannel.addEventListener("permissions_updated", onPermissionsUpdated);

    onPermissionsUpdated();

    // We currently only support sharing one video stream at the same time
    setSharingSource(
      mediaDevicesManager.isVideoShared
        ? mediaDevicesManager.isWebcamShared
          ? MediaDevices.CAMERA
          : MediaDevices.SCREEN
        : null
    );

    return () => {
      scene.removeEventListener("share_video_enabled", onShareVideoEnabled);
      scene.removeEventListener("share_video_disabled", onShareVideoDisabled);
      scene.removeEventListener("share_video_failed", onShareVideoDisabled);
      hubChannel.removeEventListener("permissions_updated", onPermissionsUpdated);
    };
  }, [scene, hubChannel, hasVideoTextureTarget, mediaDevicesManager]);

  const toggleShareCamera = useCallback(() => {
    if (sharingSource) {
      scene.emit(MediaDevicesEvents.VIDEO_SHARE_ENDED);
    } else {
      scene.emit("action_share_camera");
    }
  }, [scene, sharingSource]);

  const toggleShareScreen = useCallback(() => {
    if (sharingSource) {
      scene.emit(MediaDevicesEvents.VIDEO_SHARE_ENDED);
    } else {
      scene.emit("action_share_screen");
    }
  }, [scene, sharingSource]);

  const toggleShareCameraToAvatar = useCallback(() => {
    if (sharingSource) {
      scene.emit(MediaDevicesEvents.VIDEO_SHARE_ENDED);
    } else {
      scene.emit("action_share_camera", { target: "avatar" });
    }
  }, [scene, sharingSource]);

  return {
    sharingSource,
    canShareCamera,
    canShareCameraToAvatar,
    canShareScreen,
    toggleShareCamera,
    toggleShareCameraToAvatar,
    toggleShareScreen
  };
}

export function SharePopoverContainer({ scene, hubChannel }) {
  const {
    sharingSource,
    canShareCamera,
    toggleShareCamera,
    canShareScreen,
    toggleShareScreen,
    canShareCameraToAvatar,
    toggleShareCameraToAvatar
  } = useShare(scene, hubChannel);

  const items = [
    canShareCamera && {
      id: "camera",
      icon: VideoIcon,
      color: "accent5",
      label: <FormattedMessage id="share-popover.source.camera" defaultMessage="Camera" />,
      onSelect: toggleShareCamera,
      active: sharingSource === MediaDevices.CAMERA
    },
    canShareScreen && {
      id: "screen",
      icon: DesktopIcon,
      color: "accent5",
      label: <FormattedMessage id="share-popover.source.screen" defaultMessage="Screen" />,
      onSelect: toggleShareScreen,
      active: sharingSource === MediaDevices.SCREEN
    },
    canShareCameraToAvatar && {
      id: "camera-to-avatar",
      icon: AvatarIcon,
      color: "accent5",
      label: <FormattedMessage id="share-popover.source.avatar-camera" defaultMessage="Avatar Camera" />,
      onSelect: toggleShareCameraToAvatar,
      active: sharingSource === "camera-to-avatar"
    }
  ];

  return <SharePopoverButton items={items} />;
}

SharePopoverContainer.propTypes = {
  hubChannel: PropTypes.object.isRequired,
  scene: PropTypes.object.isRequired
};
