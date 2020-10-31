import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { LeaveRoomModal } from "./LeaveRoomModal";

export default {
  title: "LeaveRoomModal",
  parameters: {
    layout: "fullscreen"
  },
  args: {
    destinationUrl: "#"
  }
};

export const LeaveRoom = args => <RoomLayout modal={<LeaveRoomModal messageType="join-room" {...args} />} />;

export const CreateRoom = args => <RoomLayout modal={<LeaveRoomModal messageType="create-room" {...args} />} />;
