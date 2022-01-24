import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { AudioPopoverButton } from "./AudioPopoverButton";
import { AudioPopoverContent } from "./AudioPopoverContent";

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
  title: "Room/AudioPopover",
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
    micLevel: {
      control: {
        type: "number",
        min: 0,
        max: 1,
        step: 0.1
      }
    },
    speakerLevel: {
      control: {
        type: "number",
        min: 0,
        max: 1,
        step: 0.1
      }
    }
  }
};

const Template = args => (
  <RoomLayout
    toolbarCenter={
      <AudioPopoverButton
        content={
          <AudioPopoverContent
            selectedMicrophone={args.selectedMicrophone}
            isMicrophoneEnabled={args.isMicrophoneEnabled}
            microphoneOptions={args.microphoneOptions}
            micLevel={args.micLevel}
            selectedSpeaker={args.selectedSpeaker}
            speakerOptions={args.speakerOptions}
            speakerLevel={args.speakerLevel}
            isMicrophoneMuted={args.isMicrophoneMuted}
            permissionStatus={args.permissionStatus}
            onChangeMicrophone={args.onChangeMicrophone}
            onChangeMicrophoneMuted={args.onChangeMicrophoneMuted}
            onChangeSpeaker={args.onChangeSpeaker}
            onPlaySound={args.onPlaySound}
          />
        }
        initiallyVisible
        isMicrophoneEnabled={args.isMicrophoneEnabled}
        isMicrophoneMuted={args.isMicrophoneMuted}
        onChangeMicrophoneMuted={args.onChangeMicrophoneMuted}
      />
    }
  />
);

export const Base = Template.bind({});

Base.args = {
  selectedMicrophone: micOptions[0],
  isMicrophoneEnabled: true,
  microphoneOptions: micOptions,
  micLevel: 0.5,
  selectedSpeaker: speakerOptions[0],
  speakerOptions: speakerOptions,
  speakerLevel: 0.5,
  isMicrophoneMuted: false
};
