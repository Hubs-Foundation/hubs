import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { AutoExitWarningModal, AutoExitReason } from "./AutoExitWarningModal";

export default {
  title: "Room/AutoExitWarningModal",
  parameters: {
    layout: "fullscreen"
  }
};

export const ConcurrentSession = () => (
  <RoomLayout modal={<AutoExitWarningModal reason={AutoExitReason.concurrentSession} secondsRemaining={5} />} />
);

export const Idle = () => (
  <RoomLayout modal={<AutoExitWarningModal reason={AutoExitReason.idle} secondsRemaining={5} />} />
);
