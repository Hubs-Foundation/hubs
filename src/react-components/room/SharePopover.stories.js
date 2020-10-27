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

export const Base = () => <RoomLayout toolbarCenter={<SharePopoverButton items={items} />} />;

Base.parameters = {
  layout: "fullscreen"
};

export const Mobile = () => <RoomLayout toolbarCenter={<SharePopoverButton items={[items[0]]} />} />;

Mobile.parameters = {
  layout: "fullscreen"
};

const activeItems = [
  { id: "camera", icon: VideoIcon, color: "purple", label: "Camera", active: true },
  { id: "screen", icon: DesktopIcon, color: "purple", label: "Screen" }
];

export const Active = () => <RoomLayout toolbarCenter={<SharePopoverButton items={activeItems} />} />;

Active.parameters = {
  layout: "fullscreen"
};
