import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { SafariMicModal } from "./SafariMicModal";

export default {
  title: "Room/SafariMicModal",
  parameters: {
    layout: "fullscreen"
  }
};

export const Base = () => <RoomLayout modal={<SafariMicModal />} />;
