import React from "react";
import { Popover } from "../popover/Popover";
import { ToolbarButton } from "../input/ToolbarButton";
import { RoomLayout } from "../layout/RoomLayout";
import { ReactComponent as PenIcon } from "../icons/Pen.svg";
import { ReactComponent as CameraIcon } from "../icons/Camera.svg";
import { ReactComponent as TextIcon } from "../icons/Text.svg";
import { ReactComponent as LinkIcon } from "../icons/Link.svg";
import { ReactComponent as GIFIcon } from "../icons/GIF.svg";
import { ReactComponent as ObjectIcon } from "../icons/Object.svg";
import { ReactComponent as AvatarIcon } from "../icons/Avatar.svg";
import { ReactComponent as SceneIcon } from "../icons/Scene.svg";
import { ReactComponent as UploadIcon } from "../icons/Upload.svg";
import { ButtonGridPopover } from "../popover/ButtonGridPopover";

export default {
  title: "PlacePopover"
};

const items = [
  { id: "pen", icon: PenIcon, color: "purple", label: "Pen" },
  { id: "camera", icon: CameraIcon, color: "purple", label: "Camera" },
  { id: "text", icon: TextIcon, color: "blue", label: "Text" },
  { id: "link", icon: LinkIcon, color: "blue", label: "Link" },
  { id: "gif", icon: GIFIcon, color: "orange", label: "GIF" },
  { id: "model", icon: ObjectIcon, color: "orange", label: "3D Model" },
  { id: "avatar", icon: AvatarIcon, color: "red", label: "Avatar" },
  { id: "scene", icon: SceneIcon, color: "red", label: "Scene" },
  { id: "upload", icon: UploadIcon, color: "green", label: "Upload" }
];

export const Base = () => (
  <RoomLayout
    toolbarCenter={
      <Popover
        title="Place"
        content={props => <ButtonGridPopover items={items} onSelect={item => console.log(item)} {...props} />}
        placement="top"
        offsetDistance={28}
        initiallyVisible
      >
        {({ togglePopover, popoverVisible, triggerRef }) => (
          <ToolbarButton
            ref={triggerRef}
            icon={<ObjectIcon />}
            selected={popoverVisible}
            onClick={togglePopover}
            label="Place"
            preset="green"
          />
        )}
      </Popover>
    }
  />
);

Base.parameters = {
  layout: "fullscreen"
};
