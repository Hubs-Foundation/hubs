import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { EnterOnDeviceModal } from "./EnterOnDeviceModal";

export default {
  title: "EnterOnDeviceModal"
};

export const Base = () => <RoomLayout modal={<EnterOnDeviceModal shortUrl="hub.link" code="IDEB" />} />;

Base.parameters = {
  layout: "fullscreen"
};

export const HeadsetConnected = () => (
  <RoomLayout modal={<EnterOnDeviceModal shortUrl="hub.link" code="IDEB" headsetConnected />} />
);

HeadsetConnected.parameters = {
  layout: "fullscreen"
};
