import React from "react";
import { PermissionStatus } from "../../utils/media-devices-manager";
import { RoomLayout } from "../layout/RoomLayout";
import { MicSetupModal } from "./MicSetupModal";

const micOptions = ["Microphone 1", "Microphone 2 long text", "Microphone 3 even much much longer text"];
const speakerOptions = ["Speaker 1", "Speaker 2 long text", "Speaker 3 event much much longer text"];

export default {
  title: "Room/MicSetupModal",
  parameters: {
    layout: "fullscreen"
  },
  argTypes: {
    onChangeMicrophone: { action: "microphone changed" },
    onChangeSpeaker: { action: "speaker changed" },
    onPlaySound: { action: "sound played" },
    onChangeMicrophoneMuted: { action: "microphone mute state changed" },
    onEnterRoom: { action: "enter room" },
    onBack: { action: "back" },
    onTestAudio: { action: "test audio" },
    selectedMicrophone: {
      control: {
        type: "select",
        options: micOptions
      }
    },
    selectedSpeaker: {
      control: {
        type: "select",
        options: speakerOptions
      }
    }
  }
};

const Template = args => <RoomLayout viewport={<MicSetupModal {...args} />} />;

export const Base = Template.bind({});

Base.args = {
  selectedMicrophone: micOptions[0],
  microphoneEnabled: true,
  microphoneOptions: micOptions,
  micLevel: 0.5,
  selectedSpeaker: speakerOptions[0],
  speakerOptions: speakerOptions,
  speakerLevel: 0.5,
  microphoneMuted: false
};

export const NoSpeakers = Template.bind({});

NoSpeakers.args = {
  selectedMicrophone: micOptions[0],
  microphoneEnabled: true,
  microphoneOptions: micOptions,
  micLevel: 0.5,
  microphoneMuted: false
};

export const NoPermissions = Template.bind({});

NoPermissions.args = {
  selectedMicrophone: micOptions[0],
  microphoneEnabled: true,
  microphoneOptions: micOptions,
  micLevel: 0.5,
  selectedSpeaker: speakerOptions[0],
  speakerOptions: speakerOptions,
  speakerLevel: 0.5,
  microphoneMuted: false,
  PermissionStatus: PermissionStatus.DENIED
};
