import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { SafariMicModal } from "./SafariMicModal";

export default {
  title: "SafariMicModal"
};

export const Base = () => <RoomLayout modal={<SafariMicModal />} />;

Base.parameters = {
  layout: "fullscreen"
};
