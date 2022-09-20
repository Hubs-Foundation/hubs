import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { ObjectActionModal } from "./ObjectActionModal";

export default {
  title: "ProductModal",
  parameters: {
    layout: "fullscreen"
  }
};

export const Base = () => <RoomLayout modal={<ObjectActionModal />} />;