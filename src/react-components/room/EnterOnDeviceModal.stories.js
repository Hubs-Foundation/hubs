import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { EnterOnDeviceModal } from "./EnterOnDeviceModal";

export default {
  title: "EnterOnDeviceModal",
  parameters: {
    layout: "fullscreen"
  }
};

export const Base = () => <RoomLayout modal={<EnterOnDeviceModal shortUrl="hub.link" code="IDEB" />} />;

export const HeadsetConnected = () => (
  <RoomLayout modal={<EnterOnDeviceModal shortUrl="hub.link" code="IDEB" headsetConnected />} />
);

export const VrNotSupported = () => (
  <RoomLayout modal={<EnterOnDeviceModal unsupportedBrowser shortUrl="hub.link" code="IDEB" headsetConnected />} />
);

export const LoadingCode = () => <RoomLayout modal={<EnterOnDeviceModal loadingCode />} />;
