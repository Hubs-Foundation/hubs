import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { ReactComponent as VideoIcon } from "../icons/Video.svg";
import { ReactComponent as DesktopIcon } from "../icons/Desktop.svg";
import { SharePopoverButton } from "./SharePopover";

export default {
  title: "SharePopover"
};

const items = [
  { id: "camera", icon: VideoIcon, color: "purple", label: "Camera" },
  { id: "screen", icon: DesktopIcon, color: "purple", label: "Screen" }
];

export const Base = () => (
  <RoomLayout toolbarCenter={<SharePopoverButton items={items} onSelect={item => console.log(item)} />} />
);

Base.parameters = {
  layout: "fullscreen"
};
