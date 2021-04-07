import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { CloseRoomModal } from "./CloseRoomModal";

export default {
  title: "Room/CloseRoomModal",
  parameters: {
    layout: "fullscreen"
  }
};

export const Base = () => <RoomLayout modal={<CloseRoomModal />} />;
