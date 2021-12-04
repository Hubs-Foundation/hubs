import React from "react";
import { PermissionStatus } from "../../utils/media-devices-utils";
import { RoomLayout } from "../layout/RoomLayout";
import { MicSetupModal } from "./MicSetupModal";

const micOptions = ["Microphone 1", "Microphone 2 long text", "Microphone 3 even much much longer text"];
const speakerOptions = ["Speaker 1", "Speaker 2 long text", "Speaker 3 event much much longer text"];
const permissionOptions = [PermissionStatus.PROMPT, PermissionStatus.GRANTED, PermissionStatus.DENIED];

export default {
  title: "Room/MicSetupModal",
  parameters: {
    layout: "fullscreen"
  },
  argTypes: {
    onChangeMicrophone: {
      action: "microphone changed",
      table: {
        category: "Events"
      }
    },
    onChangeSpeaker: {
      action: "speaker changed",
      table: {
        category: "Events"
      }
    },
    onPlaySound: {
      action: "sound played",
      table: {
        category: "Events"
      }
    },
    onChangeMicrophoneMuted: {
      action: "microphone mute state changed",
      table: {
        category: "Events"
      }
    },
    onEnterRoom: {
      action: "enter room",
      table: {
        category: "Events"
      }
    },
    onBack: {
      action: "back",
      table: {
        category: "Events"
      }
    },
    onTestAudio: {
      action: "test audio",
      table: {
        category: "Events"
      }
    },
    selectedMicrophone: {
      control: {
        type: "select",
        options: micOptions
      },
      defaultValue: micOptions[0]
    },
    selectedSpeaker: {
      control: {
        type: "select",
        options: speakerOptions
      },
      defaultValue: speakerOptions[0]
    },
    permissionStatus: {
      control: {
        type: "select",
        options: permissionOptions
      },
      defaultValue: permissionOptions[0]
    }
  }
};

const Template = args => <RoomLayout viewport={<MicSetupModal {...args} />} />;

export const Prompt = Template.bind({});

Prompt.args = {
  selectedMicrophone: micOptions[0],
  isMicrophoneEnabled: true,
  microphoneOptions: micOptions,
  micLevel: 0.5,
  selectedSpeaker: speakerOptions[0],
  speakerOptions: speakerOptions,
  speakerLevel: 0.5,
  isMicrophoneMuted: false,
  permissionStatus: PermissionStatus.PROMPT
};

export const Granted = Template.bind({});

Granted.args = {
  selectedMicrophone: micOptions[0],
  isMicrophoneEnabled: true,
  microphoneOptions: micOptions,
  micLevel: 0.5,
  selectedSpeaker: speakerOptions[0],
  speakerOptions: speakerOptions,
  speakerLevel: 0.5,
  isMicrophoneMuted: false,
  permissionStatus: PermissionStatus.GRANTED
};

export const Denied = Template.bind({});

Denied.args = {
  selectedMicrophone: micOptions[0],
  isMicrophoneEnabled: true,
  microphoneOptions: micOptions,
  micLevel: 0.5,
  selectedSpeaker: speakerOptions[0],
  speakerOptions: speakerOptions,
  speakerLevel: 0.5,
  isMicrophoneMuted: false,
  permissionStatus: PermissionStatus.DENIED
};

export const NoSpeakers = Template.bind({});

NoSpeakers.args = {
  selectedMicrophone: micOptions[0],
  isMicrophoneEnabled: true,
  microphoneOptions: micOptions,
  micLevel: 0.5,
  isMicrophoneMuted: false,
  permissionStatus: PermissionStatus.GRANTED
};
