import React from "react";
import PropTypes from "prop-types";
import { ReactComponent as PenIcon } from "../icons/Pen.svg";
import { ReactComponent as CameraIcon } from "../icons/Camera.svg";
// import { ReactComponent as TextIcon } from "../icons/Text.svg";
// import { ReactComponent as LinkIcon } from "../icons/Link.svg";
import { ReactComponent as GIFIcon } from "../icons/GIF.svg";
import { ReactComponent as ObjectIcon } from "../icons/Object.svg";
import { ReactComponent as AvatarIcon } from "../icons/Avatar.svg";
import { ReactComponent as SceneIcon } from "../icons/Scene.svg";
import { ReactComponent as UploadIcon } from "../icons/Upload.svg";
import { PlacePopoverButton } from "./PlacePopover";

export function PlacePopoverContainer({ scene, mediaSearchStore, pushHistoryState }) {
  // TODO: Check permissions for each item
  const items = [
    {
      id: "pen",
      icon: PenIcon,
      color: "purple",
      label: "Pen",
      onSelect: () => scene.emit("penButtonPressed")
    },
    {
      id: "camera",
      icon: CameraIcon,
      color: "purple",
      label: "Camera",
      onSelect: () => scene.emit("action_toggle_camera")
    },
    // TODO: Create text/link dialog
    // { id: "text", icon: TextIcon, color: "blue", label: "Text" },
    // { id: "link", icon: LinkIcon, color: "blue", label: "Link" },
    {
      id: "gif",
      icon: GIFIcon,
      color: "orange",
      label: "GIF",
      onSelect: () => mediaSearchStore.sourceNavigate("gifs")
    },
    {
      id: "model",
      icon: ObjectIcon,
      color: "orange",
      label: "3D Model",
      onSelect: () => mediaSearchStore.sourceNavigate("poly")
    },
    {
      id: "avatar",
      icon: AvatarIcon,
      color: "red",
      label: "Avatar",
      onSelect: () => mediaSearchStore.sourceNavigate("avatars")
    },
    {
      id: "scene",
      icon: SceneIcon,
      color: "red",
      label: "Scene",
      onSelect: () => mediaSearchStore.sourceNavigate("scenes")
    },
    // TODO: Launch system file prompt directly
    {
      id: "upload",
      icon: UploadIcon,
      color: "green",
      label: "Upload",
      onSelect: () => pushHistoryState("modal", "create")
    }
  ];

  return <PlacePopoverButton items={items} />;
}

PlacePopoverContainer.propTypes = {
  scene: PropTypes.object.isRequired,
  mediaSearchStore: PropTypes.object.isRequired,
  pushHistoryState: PropTypes.object.isRequired
};
