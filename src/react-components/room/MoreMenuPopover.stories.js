import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { ReactComponent as CameraIcon } from "../icons/Camera.svg";
import { ReactComponent as AvatarIcon } from "../icons/Avatar.svg";
import { ReactComponent as SceneIcon } from "../icons/Scene.svg";
import { ReactComponent as StarOutlineIcon } from "../icons/StarOutline.svg";
import { ReactComponent as SettingsIcon } from "../icons/Settings.svg";
import { ReactComponent as WarningCircleIcon } from "../icons/WarningCircle.svg";
import { ReactComponent as HomeIcon } from "../icons/Home.svg";
import { ReactComponent as TextDocumentIcon } from "../icons/TextDocument.svg";
import { ReactComponent as SupportIcon } from "../icons/Support.svg";
import { ReactComponent as ShieldIcon } from "../icons/Shield.svg";
import { CompactMoreMenuButton, MoreMenuContextProvider, MoreMenuPopoverButton } from "./MoreMenuPopover";
import { TERMS, PRIVACY } from "../../constants";

export default {
  title: "Room/MoreMenuPopover",
  parameters: {
    layout: "fullscreen"
  }
};

const menu = [
  {
    id: "user",
    label: "You",
    items: [
      { id: "user-profile", label: "Change Name & Avatar", icon: AvatarIcon },
      { id: "favorite-room", label: "Favorite Room", icon: StarOutlineIcon },
      { id: "preferences", label: "Preferences", icon: SettingsIcon }
    ]
  },
  {
    id: "room",
    label: "Room",
    items: [
      { id: "room-settings", label: "Room Settings", icon: HomeIcon },
      { id: "change-scene", label: "Change Scene", icon: SceneIcon },
      { id: "camera-mode", label: "Enter Camera Mode", icon: CameraIcon }
    ]
  },
  {
    id: "support",
    label: "Support",
    items: [
      {
        id: "report-issue",
        label: "Report Issue",
        icon: WarningCircleIcon,
        href: "https://github.com/Hubs-Foundation/hubs/issues/new/choose"
      },
      {
        id: "help",
        label: "Help",
        icon: SupportIcon,
        href: "https://docs.hubsfoundation.org"
      },
      {
        id: "tos",
        label: "Terms of Service",
        icon: TextDocumentIcon,
        href: TERMS
      },
      {
        id: "privacy",
        label: "Privacy Notice",
        icon: ShieldIcon,
        href: PRIVACY
      }
    ]
  }
];

export const Base = () => (
  <MoreMenuContextProvider initiallyVisible={true}>
    <RoomLayout viewport={<CompactMoreMenuButton />} toolbarRight={<MoreMenuPopoverButton menu={menu} />} />
  </MoreMenuContextProvider>
);
