import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { AudioToolbarPopoverButton } from "./AudioToolbarPopover";

const micOptions = ["Microphone 1", "Microphone 2 long text", "Microphone 3 even much much longer text"];
const speakerOptions = [
  "Speaker 1",
  "Speaker 2",
  "Speaker 3",
  "Speaker 4",
  "Speaker 5",
  "Speaker 6",
  "Speaker long text",
  "Speaker event much much longer text"
];

export default {
  title: "Room/AudioToolbarPopover",
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
    }
  }
};

const Template = args => <RoomLayout toolbarCenter={<AudioToolbarPopoverButton initiallyVisible {...args} />} />;

export const Base = Template.bind({});

Base.args = {
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
