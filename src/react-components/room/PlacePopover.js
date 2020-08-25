import React from "react";
import { ToolbarButton } from "../input/ToolbarButton";
import { ReactComponent as PenIcon } from "../icons/Pen.svg";
import { ReactComponent as CameraIcon } from "../icons/Camera.svg";
import { ReactComponent as TextIcon } from "../icons/Text.svg";
import { ReactComponent as LinkIcon } from "../icons/Link.svg";
import { ReactComponent as GIFIcon } from "../icons/GIF.svg";
import { ReactComponent as ObjectIcon } from "../icons/Object.svg";
import { ReactComponent as AvatarIcon } from "../icons/Avatar.svg";
import { ReactComponent as SceneIcon } from "../icons/Scene.svg";
import { ReactComponent as UploadIcon } from "../icons/Upload.svg";
import styles from "./PlacePopover.scss";

export function PlacePopover() {
  return (
    <div className={styles.placePopover}>
      <ToolbarButton icon={<PenIcon />} preset="purple" onClick={() => console.log("pen")} label="Pen" />
      <ToolbarButton icon={<CameraIcon />} preset="purple" onClick={() => console.log("camera")} label="Camera" />
      <ToolbarButton icon={<TextIcon />} preset="blue" onClick={() => console.log("text")} label="Text" />
      <ToolbarButton icon={<LinkIcon />} preset="blue" onClick={() => console.log("link")} label="Link" />
      <ToolbarButton icon={<GIFIcon />} preset="orange" onClick={() => console.log("gif")} label="GIF" />
      <ToolbarButton icon={<ObjectIcon />} preset="orange" onClick={() => console.log("model")} label="3D Model" />
      <ToolbarButton icon={<AvatarIcon />} preset="red" onClick={() => console.log("avatar")} label="Avatar" />
      <ToolbarButton icon={<SceneIcon />} preset="red" onClick={() => console.log("scene")} label="Scene" />
      <ToolbarButton icon={<UploadIcon />} preset="green" onClick={() => console.log("upload")} label="Upload" />
    </div>
  );
}
