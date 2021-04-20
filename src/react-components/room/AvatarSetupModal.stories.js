import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { AvatarSetupModal } from "./AvatarSetupModal";

export default {
  title: "Room/AvatarSetupModal"
};

export const Base = () => <RoomLayout viewport={<AvatarSetupModal />} />;

Base.parameters = {
  layout: "fullscreen"
};
