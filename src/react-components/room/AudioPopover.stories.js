import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { AudioPopoverButton } from "./AudioPopoverButton";
import { AudioPopoverContent } from "./AudioPopoverContent";
import { LevelBar } from "../misc/LevelBar";
import styles from "./AudioPopover.scss";
import PropTypes from "prop-types";
import { ToolbarButton } from "../input/ToolbarButton";
import { ReactComponent as MicrophoneIcon } from "../icons/Microphone.svg";
import { ReactComponent as MicrophoneMutedIcon } from "../icons/MicrophoneMuted.svg";
import { FormattedMessage } from "react-intl";

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

const Template = args => (
  <RoomLayout
    toolbarCenter={
      <AudioPopoverButton
        initiallyVisible
        content={
          <AudioPopoverContent
            microphoneOptions={getMicOptions(args.selectedMicrophone)}
            speakerOptions={getSpeakerOptions(args.selectedSpeaker)}
            micLevelBar={<LevelBar className={styles.levelBar} />}
            speakerLevelBar={<LevelBar className={styles.levelBar} />}
            selectedMicrophone={args.selectedMicrophone}
            isMicrophoneEnabled={args.isMicrophoneEnabled}
            selectedSpeaker={args.selectedSpeaker}
            isMicrophoneMuted={args.isMicrophoneMuted}
            permissionStatus={args.permissionStatus}
            onChangeMicrophone={args.onChangeMicrophone}
            onChangeMicrophoneMuted={args.onChangeMicrophoneMuted}
            onChangeSpeaker={args.onChangeSpeaker}
            onPlaySound={args.onPlaySound}
            isAudioInputSelectAvailable={args.isAudioInputSelectAvailable}
            isAudioOutputSelectAvailable={args.isAudioOutputSelectAvailable}
            canVoiceChat={args.canVoiceChat}
          />
        }
        micButton={
          <ToolbarButton
            icon={args.isMicrophoneMuted || !args.isMicrophoneEnabled ? <MicrophoneMutedIcon /> : <MicrophoneIcon />}
            label={<FormattedMessage id="voice-button-container.label" defaultMessage="Voice" />}
            preset="basic"
            onClick={args.onChangeMicrophoneMuted}
            statusColor={args.isMicrophoneMuted || !args.isMicrophoneEnabled ? "disabled" : "enabled"}
            type={"right"}
          />
        }
      />
    }
  />
);

Template.propTypes = {
  selectedMicrophone: PropTypes.string,
  selectedSpeaker: PropTypes.string
};

export const Base = Template.bind({});

Base.args = {
  selectedMicrophone: micOptions[0],
  isMicrophoneEnabled: true,
  selectedSpeaker: speakerOptions[0],
  isMicrophoneMuted: false,
  isAudioInputSelectAvailable: true,
  isAudioOutputSelectAvailable: true
};
