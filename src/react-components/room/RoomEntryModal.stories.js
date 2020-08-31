import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { RoomEntryModal } from "./RoomEntryModal";
import logoSrc from "../../assets/images/app-logo.png";

console.log(logoSrc);

export default {
  title: "RoomEntryModal"
};

export const Base = () => <RoomLayout modal={<RoomEntryModal logoSrc={logoSrc} roomName="Example Room" />} />;

Base.parameters = {
  layout: "fullscreen"
};
