import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { ObjectUrlModal } from "./ObjectUrlModal";

export default {
  title: "ObjectUrlModal",
  parameters: {
    layout: "fullscreen"
  }
};

export const Base = () => <RoomLayout modal={<ObjectUrlModal />} />;
