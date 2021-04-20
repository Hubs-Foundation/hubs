import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { MicSetupModal } from "./MicSetupModal";

export default {
  title: "Room/MicSetupModal",
  parameters: {
    layout: "fullscreen"
  }
};

const micOptions = ["Microphone 1", "Microphone 2", "Microphone 3"];

export const Base = () => (
  <RoomLayout
    viewport={<MicSetupModal selectedMicrophone="Microphone 1" microphoneEnabled microphoneOptions={micOptions} />}
  />
);

export const TestMicrophone = () => (
  <RoomLayout
    viewport={
      <MicSetupModal
        selectedMicrophone="Microphone 1"
        microphoneEnabled
        microphoneOptions={micOptions}
        micLevel={0.5}
      />
    }
  />
);

export const TestSound = () => (
  <RoomLayout
    viewport={
      <MicSetupModal selectedMicrophone="Microphone 1" microphoneEnabled microphoneOptions={micOptions} soundPlaying />
    }
  />
);

export const MicrophoneDisabled = () => (
  <RoomLayout viewport={<MicSetupModal selectedMicrophone="Microphone 1" microphoneOptions={micOptions} />} />
);
