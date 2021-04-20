import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { RoomEntryModal } from "./RoomEntryModal";
import logoSrc from "../../assets/images/app-logo.png";

export default {
  title: "Room/RoomEntryModal",
  parameters: {
    layout: "fullscreen"
  }
};

export const Base = () => <RoomLayout viewport={<RoomEntryModal logoSrc={logoSrc} roomName="Example Room" />} />;
