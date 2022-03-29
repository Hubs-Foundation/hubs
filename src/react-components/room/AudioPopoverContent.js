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
import MediaDevicesManager from "../../utils/media-devices-manager";

export const AudioPopoverContent = ({
  micLevel,
  microphoneOptions,
  onChangeMicrophone,
  isMicrophoneEnabled,
  isMicrophoneMuted,
  onChangeMicrophoneMuted,
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
      {MediaDevicesManager.isAudioInputSelectEnabled && (
        <SelectInputField
          className={styles.selectionInput}
          buttonClassName={styles.selectionInput}
          onChange={onChangeMicrophone}
          {...microphoneOptions}
        />
      )}
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
      {MediaDevicesManager.isAudioOutputSelectEnabled && (
        <SelectInputField
          className={styles.selectionInput}
          buttonClassName={styles.selectionInput}
          onChange={onChangeSpeaker}
          {...speakerOptions}
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
  microphoneOptions: PropTypes.object,
  onChangeMicrophone: PropTypes.func,
  speakerOptions: PropTypes.object,
  onChangeSpeaker: PropTypes.func
};
