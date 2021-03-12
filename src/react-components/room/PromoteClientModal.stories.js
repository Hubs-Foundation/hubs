import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { PromoteClientModal } from "./PromoteClientModal";

export default {
  title: "PromoteClientModal",
  parameters: {
    layout: "fullscreen"
  }
};

export const Base = () => <RoomLayout modal={<PromoteClientModal displayName="Test User" />} />;
