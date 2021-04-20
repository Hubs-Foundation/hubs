import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { AvatarSettingsSidebar } from "./AvatarSettingsSidebar";

export default {
  title: "Room/AvatarSettingsSidebar",
  parameters: {
    layout: "fullscreen"
  }
};

export const Base = () => <RoomLayout sidebar={<AvatarSettingsSidebar />} />;
