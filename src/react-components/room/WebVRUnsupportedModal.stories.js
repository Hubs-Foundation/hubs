import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { WebVRUnsupportedModal } from "./WebVRUnsupportedModal";

export default {
  title: "WebVRUnsupportedModal",
  parameters: {
    layout: "fullscreen"
  }
};

export const Base = () => <RoomLayout modal={<WebVRUnsupportedModal />} />;
