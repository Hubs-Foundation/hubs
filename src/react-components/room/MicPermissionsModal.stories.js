import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { MicPermissionsModal } from "./MicPermissionsModal";

export default {
  title: "Room/MicPermissionsModal",
  parameters: {
    layout: "fullscreen"
  }
};

export const Base = () => <RoomLayout viewport={<MicPermissionsModal />} />;

export const Error = () => (
  <RoomLayout viewport={<MicPermissionsModal error="Microphone access not allowed." errorButtonLabel="Help" />} />
);
