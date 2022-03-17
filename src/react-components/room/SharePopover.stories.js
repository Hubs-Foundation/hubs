import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { ReactComponent as VideoIcon } from "../icons/Video.svg";
import { ReactComponent as DesktopIcon } from "../icons/Desktop.svg";
import { SharePopoverButton } from "./SharePopover";

export default {
  title: "Room/SharePopover",
  parameters: {
    layout: "fullscreen"
  }
};

const items = [
  { id: "camera", icon: VideoIcon, color: "accent5", label: "カメラ" },
  { id: "screen", icon: DesktopIcon, color: "accent5", label: "画面" }
];

export const Base = () => <RoomLayout toolbarCenter={<SharePopoverButton items={items} />} />;

export const Mobile = () => <RoomLayout toolbarCenter={<SharePopoverButton items={[items[0]]} />} />;

const activeItems = [
  { id: "camera", icon: VideoIcon, color: "accent5", label: "カメラ", active: true },
  { id: "screen", icon: DesktopIcon, color: "accent5", label: "画面" }
];

export const Active = () => <RoomLayout toolbarCenter={<SharePopoverButton items={activeItems} />} />;
