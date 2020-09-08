import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { Modal } from "../modal/Modal";
import { Button } from "../input/Button";
import { ReactComponent as ChevronBackIcon } from "../icons/ChevronBack.svg";
import { ReactComponent as MicrophoneIcon } from "../icons/Microphone.svg";
import { ReactComponent as MicrophoneMutedIcon } from "../icons/MicrophoneMuted.svg";
import { ReactComponent as VolumeHighIcon } from "../icons/VolumeHigh.svg";
import { ReactComponent as VolumeOffIcon } from "../icons/VolumeOff.svg";
import styles from "./MicSetupModal.scss";
import { IconButton } from "../input/IconButton";
import { SelectInputField } from "../input/SelectInputField";
import { ToggleInput } from "../input/ToggleInput";
import { ToolbarButton } from "../input/ToolbarButton";

export function MicSetupModal({
  className,
  onPromptMicrophone,
  selectedMicrophone,
  microphoneOptions,
  onChangeMicrophone,
  microphoneEnabled,
  soundPlaying,
  microphoneMuted,
  onChangeMicrophoneMuted,
  onEnterRoom,
  onBack,
  ...rest
}) {
  return (
    <Modal
      title="Microphone Setup"
      beforeTitle={
        <IconButton onClick={onBack}>
          <ChevronBackIcon />
          <span>Back</span>
        </IconButton>
      }
      className={className}
      contentClassName={styles.content}
      {...rest}
    >
      <p>Check your microphone and audio before entering.</p>
      <div className={styles.audioCheckContainer}>
        <ToolbarButton
          icon={
            microphoneEnabled ? (
              <MicrophoneIcon width={48} height={48} />
            ) : (
              <MicrophoneMutedIcon width={48} height={48} />
            )
          }
          label={microphoneEnabled ? "Talk to Test Microphone" : "Microphone Disabled"}
          className={styles.largeToolbarButton}
          onClick={onPromptMicrophone}
          disabled={microphoneEnabled}
          large
        />
        <ToolbarButton
          icon={soundPlaying ? <VolumeHighIcon width={48} height={48} /> : <VolumeOffIcon width={48} height={48} />}
          label="Click to Test Audio"
          className={classNames(styles.largeToolbarButton, { [styles.soundPlaying]: soundPlaying })}
          large
        />
      </div>
      <SelectInputField
        disabled={!microphoneEnabled}
        value={selectedMicrophone}
        options={microphoneOptions}
        onChange={onChangeMicrophone}
      />
      <ToggleInput label="Mute My Microphone" value={microphoneMuted} onChange={onChangeMicrophoneMuted} />
      <Button preset="green" onClick={onEnterRoom}>
        Enter Room
      </Button>
    </Modal>
  );
}

MicSetupModal.propTypes = {
  className: PropTypes.string,
  soundPlaying: PropTypes.bool,
  microphoneEnabled: PropTypes.bool,
  microphoneMuted: PropTypes.bool,
  onChangeMicrophoneMuted: PropTypes.func,
  selectedMicrophone: PropTypes.string,
  microphoneOptions: PropTypes.array,
  onChangeMicrophone: PropTypes.func,
  onPromptMicrophone: PropTypes.func,
  onEnterRoom: PropTypes.func,
  onBack: PropTypes.func
};
