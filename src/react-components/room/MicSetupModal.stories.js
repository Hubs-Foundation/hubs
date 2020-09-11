import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { MicSetupModal } from "./MicSetupModal";

export default {
  title: "MicSetupModal"
};

export const Base = () => <RoomLayout modal={<MicSetupModal />} />;

Base.parameters = {
  layout: "fullscreen"
};

export const TestMicrophone = () => <RoomLayout modal={<MicSetupModal micLevel={0.5} />} />;

TestMicrophone.parameters = {
  layout: "fullscreen"
};

export const TestSound = () => <RoomLayout modal={<MicSetupModal soundPlaying />} />;

TestSound.parameters = {
  layout: "fullscreen"
};
