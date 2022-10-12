import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { ExitedRoomScreen, ExitReason } from "./ExitedRoomScreen";

export default {
  title: "Room/ExitedRoomScreen",
  args: {
    showTerms: true,
    showSourceLink: true,
    termsUrl: "#"
  },
  parameters: {
    layout: "fullscreen"
  }
};

export const Exited = args => <RoomLayout modal={<ExitedRoomScreen reason={ExitReason.exited} {...args} />} />;

export const Closed = args => <RoomLayout modal={<ExitedRoomScreen reason={ExitReason.closed} {...args} />} />;

export const Denied = args => <RoomLayout modal={<ExitedRoomScreen reason={ExitReason.denied} {...args} />} />;

export const Disconnected = args => (
  <RoomLayout modal={<ExitedRoomScreen reason={ExitReason.disconnected} {...args} />} />
);

export const Left = args => <RoomLayout modal={<ExitedRoomScreen reason={ExitReason.left} {...args} />} />;

export const Full = args => <RoomLayout modal={<ExitedRoomScreen reason={ExitReason.full} {...args} />} />;

export const SceneError = args => <RoomLayout modal={<ExitedRoomScreen reason={ExitReason.sceneError} {...args} />} />;

export const ConnectError = args => (
  <RoomLayout modal={<ExitedRoomScreen reason={ExitReason.connectError} {...args} />} />
);

export const VersionMismatch = args => (
  <RoomLayout modal={<ExitedRoomScreen reason={ExitReason.versionMismatch} {...args} />} />
);
