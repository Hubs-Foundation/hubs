import React from "react";
import { PermissionStatus } from "../../utils/media-devices-utils";
import { RoomLayout } from "../layout/RoomLayout";
import { MicSetupModal } from "./MicSetupModal";
import { LevelBar } from "../misc/LevelBar";
import styles from "./MicSetupModal.scss";
import PropTypes from "prop-types";

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
    },
    canVoiceChat: {
      control: "boolean",
      defaultValue: true
    }
  }
};

function getMicOptions(micId) {
  return {
    value: micId,
    options: micOptions.map(option => {
      return {
        label: option,
        value: option
      };
    })
  };
}

function getSpeakerOptions(speakerId) {
  return {
    value: speakerId,
    options: speakerOptions.map(option => {
      return {
        label: option,
        value: option
      };
    })
  };
}

const Template = ({ selectedMicrophone, selectedSpeaker, ...rest }) => {
  return (
    <RoomLayout
      viewport={
        <MicSetupModal
          microphoneOptions={getMicOptions(selectedMicrophone)}
          speakerOptions={getSpeakerOptions(selectedSpeaker)}
          micLevelBar={<LevelBar className={styles.levelBar} />}
          speakerLevelBar={<LevelBar className={styles.levelBar} />}
          {...rest}
        />
      }
    />
  );
};

Template.propTypes = {
  selectedMicrophone: PropTypes.string,
  selectedSpeaker: PropTypes.string
};

export const Prompt = Template.bind({});

Prompt.args = {
  isMicrophoneEnabled: true,
  selectedMicrophone: micOptions[0],
  selectedSpeaker: speakerOptions[0],
  isMicrophoneMuted: false,
  permissionStatus: PermissionStatus.PROMPT,
  isAudioInputSelectAvailable: true,
  isAudioOutputSelectAvailable: true
};

export const Granted = Template.bind({});

Granted.args = {
  isMicrophoneEnabled: true,
  selectedMicrophone: micOptions[0],
  selectedSpeaker: speakerOptions[0],
  isMicrophoneMuted: false,
  permissionStatus: PermissionStatus.GRANTED,
  isAudioInputSelectAvailable: true,
  isAudioOutputSelectAvailable: true
};

export const Denied = Template.bind({});

Denied.args = {
  isMicrophoneEnabled: true,
  selectedMicrophone: micOptions[0],
  selectedSpeaker: speakerOptions[0],
  isMicrophoneMuted: false,
  permissionStatus: PermissionStatus.DENIED,
  isAudioInputSelectAvailable: true,
  isAudioOutputSelectAvailable: true
};

export const NoSpeakers = Template.bind({});

NoSpeakers.args = {
  isMicrophoneEnabled: true,
  selectedMicrophone: micOptions[0],
  isMicrophoneMuted: false,
  permissionStatus: PermissionStatus.GRANTED,
  isAudioInputSelectAvailable: true,
  isAudioOutputSelectAvailable: false
};

export const NoVoiceChat = Template.bind({});

NoVoiceChat.args = {
  canVoiceChat: false
};
