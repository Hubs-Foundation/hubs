import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { MicSetupModal } from "./MicSetupModal";

export default {
  title: "MicSetupModal"
};

const micOptions = ["Microphone 1", "Microphone 2", "Microphone 3"];

export const Base = () => (
  <RoomLayout
    viewport={<MicSetupModal selectedMicrophone="Microphone 1" microphoneEnabled microphoneOptions={micOptions} />}
  />
);

Base.parameters = {
  layout: "fullscreen"
};

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

TestMicrophone.parameters = {
  layout: "fullscreen"
};

export const TestSound = () => (
  <RoomLayout
    viewport={
      <MicSetupModal selectedMicrophone="Microphone 1" microphoneEnabled microphoneOptions={micOptions} soundPlaying />
    }
  />
);

TestSound.parameters = {
  layout: "fullscreen"
};

export const MicrophoneDisabled = () => (
  <RoomLayout viewport={<MicSetupModal selectedMicrophone="Microphone 1" microphoneOptions={micOptions} />} />
);

MicrophoneDisabled.parameters = {
  layout: "fullscreen"
};
