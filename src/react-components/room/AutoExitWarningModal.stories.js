import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { AutoExitWarningModal } from "./AutoExitWarningModal";

export default {
  title: "AutoExitWarningModal"
};

export const ConcurrentSession = () => (
  <RoomLayout modal={<AutoExitWarningModal reason="concurrentSession" secondsRemaining={5} />} />
);

ConcurrentSession.parameters = {
  layout: "fullscreen"
};

export const Idle = () => <RoomLayout modal={<AutoExitWarningModal reason="idle" secondsRemaining={5} />} />;

Idle.parameters = {
  layout: "fullscreen"
};
