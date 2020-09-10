import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { MicSetupModal } from "./MicSetupModal";

export default {
  title: "MicSetupModal"
};

export const Base = () => <RoomLayout modal={<MicSetupModal />} />;

Base.parameters = {
  layout: "fullscreen"
};
