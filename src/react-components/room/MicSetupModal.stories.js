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

export const Error = () => (
  <RoomLayout modal={<MicSetupModal error="Microphone access not allowed." errorButtonLabel="Help" />} />
);

Error.parameters = {
  layout: "fullscreen"
};
