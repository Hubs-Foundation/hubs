import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { MicPermissionsModal } from "./MicPermissionsModal";

export default {
  title: "MicPermissionsModal"
};

export const Base = () => <RoomLayout modal={<MicPermissionsModal />} />;

Base.parameters = {
  layout: "fullscreen"
};

export const Error = () => (
  <RoomLayout modal={<MicPermissionsModal error="Microphone access not allowed." errorButtonLabel="Help" />} />
);

Error.parameters = {
  layout: "fullscreen"
};
