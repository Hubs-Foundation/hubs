import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { AvatarUrlModal } from "./AvatarUrlModal";

export default {
  title: "AvatarUrlModal",
  parameters: {
    layout: "fullscreen"
  }
};

export const Base = () => <RoomLayout modal={<AvatarUrlModal />} />;
