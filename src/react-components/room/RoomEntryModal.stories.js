import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { RoomEntryModal } from "./RoomEntryModal";

export default {
  title: "Room/RoomEntryModal",
  parameters: {
    layout: "fullscreen"
  }
};

export const Base = () => <RoomLayout viewport={<RoomEntryModal roomName="Example Room" />} />;
