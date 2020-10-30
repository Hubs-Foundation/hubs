import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { ExitedRoomScreen } from "./ExitedRoomScreen";
import logoSrc from "../../assets/images/company-logo.png";

export default {
  title: "ExitedRoomScreen",
  args: {
    showTerms: true,
    showSourceLink: true,
    termsUrl: "#",
    logoSrc
  },
  parameters: {
    layout: "fullscreen"
  }
};

export const Exited = args => <RoomLayout modal={<ExitedRoomScreen reason="exited" {...args} />} />;

export const Closed = args => <RoomLayout modal={<ExitedRoomScreen reason="closed" {...args} />} />;

export const Denied = args => <RoomLayout modal={<ExitedRoomScreen reason="denied" {...args} />} />;

export const Disconnected = args => <RoomLayout modal={<ExitedRoomScreen reason="disconnected" {...args} />} />;

export const Left = args => <RoomLayout modal={<ExitedRoomScreen reason="left" {...args} />} />;

export const Full = args => <RoomLayout modal={<ExitedRoomScreen reason="full" {...args} />} />;

export const SceneError = args => <RoomLayout modal={<ExitedRoomScreen reason="scene_error" {...args} />} />;

export const ConnectError = args => <RoomLayout modal={<ExitedRoomScreen reason="connect_error" {...args} />} />;

export const VersionMismatch = args => <RoomLayout modal={<ExitedRoomScreen reason="version_mismatch" {...args} />} />;
