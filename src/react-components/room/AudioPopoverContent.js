import React from "react";
import PropTypes from "prop-types";
import styles from "./AudioPopover.scss";
import { ReactComponent as MicrophoneIcon } from "../icons/Microphone.svg";
import { ReactComponent as MicrophoneMutedIcon } from "../icons/MicrophoneMuted.svg";
import { ReactComponent as VolumeOff } from "../icons/VolumeOff.svg";
import { Column } from "../layout/Column";
import { FormattedMessage } from "react-intl";
import { SelectInputField } from "../input/SelectInputField";
import { Row } from "../layout/Row";
import { LevelBar } from "../misc/LevelBar";
import { ToggleInput } from "../input/ToggleInput";
import { Divider } from "../layout/Divider";
import { Button } from "../input/Button";

export const AudioPopoverContent = ({
  micLevel,
  microphoneOptions,
  selectedMicrophone,
  onChangeMicrophone,
  isMicrophoneEnabled,
  isMicrophoneMuted,
  onChangeMicrophoneMuted,
  selectedSpeaker,
  speakerOptions,
  onChangeSpeaker,
  speakerLevel,
  onPlaySound
}) => {
  const iconStyle = isMicrophoneEnabled ? styles.iconEnabled : styles.iconDisabled;
  return (
    <Column padding grow gap="lg" className={styles.audioToolbarPopover}>
      <p style={{ alignSelf: "start" }}>
        <FormattedMessage id="mic-setup-modal.microphone-text" defaultMessage="Microphone" />
      </p>
      <SelectInputField
        className={styles.selectionInput}
        buttonClassName={styles.selectionInput}
        value={selectedMicrophone}
        options={microphoneOptions}
        onChange={onChangeMicrophone}
      />
      <Row noWrap>
        {isMicrophoneEnabled && !isMicrophoneMuted ? (
          <MicrophoneIcon className={iconStyle} style={{ marginRight: "12px" }} />
        ) : (
          <MicrophoneMutedIcon className={iconStyle} style={{ marginRight: "12px" }} />
        )}
        <LevelBar className={styles.levelBar} level={!isMicrophoneEnabled || isMicrophoneMuted ? 0 : micLevel} />
      </Row>
      <Row nowrap>
        <ToggleInput
          label={<FormattedMessage id="mic-setup-modal.mute-mic-toggle-v2" defaultMessage="Mute" />}
          checked={isMicrophoneMuted}
          onChange={onChangeMicrophoneMuted}
        />
      </Row>
      <Divider />
      <p style={{ alignSelf: "start" }}>
        <FormattedMessage id="mic-setup-modal.speakers-text" defaultMessage="Speakers" />
      </p>
      {speakerOptions?.length > 0 && (
        <SelectInputField
          className={styles.selectionInput}
          buttonClassName={styles.selectionInput}
          value={selectedSpeaker}
          options={speakerOptions}
          onChange={onChangeSpeaker}
        />
      )}
      <Row noWrap>
        <VolumeOff className={iconStyle} style={{ marginRight: "12px" }} />
        <LevelBar className={styles.levelBar} level={speakerLevel} />
      </Row>
      <Button preset="basic" onClick={onPlaySound} sm>
        <FormattedMessage id="mic-setup-modal.test-audio-button" defaultMessage="Test Audio" />
      </Button>
    </Column>
  );
};

AudioPopoverContent.propTypes = {
  isSoundPlaying: PropTypes.bool,
  onPlaySound: PropTypes.func,
  micLevel: PropTypes.number,
  speakerLevel: PropTypes.number,
  isMicrophoneEnabled: PropTypes.bool,
  isMicrophoneMuted: PropTypes.bool,
  onChangeMicrophoneMuted: PropTypes.func,
  selectedMicrophone: PropTypes.string,
  microphoneOptions: PropTypes.array,
  onChangeMicrophone: PropTypes.func,
  selectedSpeaker: PropTypes.string,
  speakerOptions: PropTypes.array,
  onChangeSpeaker: PropTypes.func
};
