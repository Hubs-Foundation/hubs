import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { AvatarSetupModal } from "./AvatarSetupModal";

export default {
  title: "AvatarSetupModal"
};

export const Base = () => <RoomLayout modal={<AvatarSetupModal />} />;

Base.parameters = {
  layout: "fullscreen"
};
