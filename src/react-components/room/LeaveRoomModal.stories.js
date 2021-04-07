import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { LeaveReason, LeaveRoomModal } from "./LeaveRoomModal";

export default {
  title: "Room/LeaveRoomModal",
  parameters: {
    layout: "fullscreen"
  },
  args: {
    destinationUrl: "#"
  }
};

export const LeaveRoom = args => <RoomLayout modal={<LeaveRoomModal reason={LeaveReason.leaveRoom} {...args} />} />;

export const CreateRoom = args => <RoomLayout modal={<LeaveRoomModal reason={LeaveReason.createRoom} {...args} />} />;

export const JoinRoom = args => <RoomLayout modal={<LeaveRoomModal reason={LeaveReason.joinRoom} {...args} />} />;
