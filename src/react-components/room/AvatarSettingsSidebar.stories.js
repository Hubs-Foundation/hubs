import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { AvatarSettingsSidebar } from "./AvatarSettingsSidebar";

export default {
  title: "AvatarSettingsSidebar"
};

export const Base = () => <RoomLayout sidebar={<AvatarSettingsSidebar />} />;

Base.parameters = {
  layout: "fullscreen"
};
