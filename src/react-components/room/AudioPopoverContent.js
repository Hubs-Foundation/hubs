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
import { ToggleInput } from "../input/ToggleInput";
import { Divider } from "../layout/Divider";
import { Button } from "../input/Button";
import { PermissionStatus } from "../../utils/media-devices-utils";

export const AudioPopoverContent = ({
  micLevelBar,
  speakerLevelBar,
  microphoneOptions,
  onChangeMicrophone,
  isMicrophoneEnabled,
  isMicrophoneMuted,
  onChangeMicrophoneMuted,
  speakerOptions,
  onChangeSpeaker,
  onPlaySound,
  isAudioInputSelectAvailable,
  isAudioOutputSelectAvailable,
  canVoiceChat,
  permissionStatus
}) => {
  const iconStyle = isMicrophoneEnabled ? styles.iconEnabled : styles.iconDisabled;

  return (
    <Column padding grow gap="lg" className={styles.audioToolbarPopover}>
      {(canVoiceChat && (
        <>
          <p style={{ alignSelf: "start" }}>
            <FormattedMessage id="mic-setup-modal.microphone-text" defaultMessage="Microphone" />
          </p>
          {isAudioInputSelectAvailable && (
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
            <> {micLevelBar}</>
          </Row>
          <Row nowrap>
            <ToggleInput
              label={<FormattedMessage id="mic-setup-modal.mute-mic-toggle-v2" defaultMessage="Mute" />}
              checked={isMicrophoneMuted}
              onChange={onChangeMicrophoneMuted}
            />
          </Row>
        </>
      )) || (
        <div className={styles.voiceChatDisabled}>
          <MicrophoneMutedIcon className={styles.iconDisabled} />
          <p className={styles.textDisabled}>
            <FormattedMessage
              id="mic-setup-modal.voice-chat-disabled"
              defaultMessage="Voice chat is <bold>turned off</bold> for this room."
              values={{
                bold: str => <b>{str}</b>
              }}
            />
          </p>
        </div>
      )}
      <Divider />
      <p style={{ alignSelf: "start" }}>
        <FormattedMessage id="mic-setup-modal.speakers-text" defaultMessage="Speakers" />
      </p>
      {permissionStatus === PermissionStatus.GRANTED && isAudioOutputSelectAvailable && (
        <SelectInputField
          className={styles.selectionInput}
          buttonClassName={styles.selectionInput}
          onChange={onChangeSpeaker}
          {...speakerOptions}
        />
      )}
      <Row noWrap>
        <VolumeOff className={iconStyle} style={{ marginRight: "12px" }} />
        <> {speakerLevelBar} </>
      </Row>
      <Button preset="basic" onClick={onPlaySound} sm>
        <FormattedMessage id="mic-setup-modal.test-audio-button" defaultMessage="Test Audio" />
      </Button>
    </Column>
  );
};

AudioPopoverContent.propTypes = {
  micLevelBar: PropTypes.node,
  speakerLevelBar: PropTypes.node,
  isSoundPlaying: PropTypes.bool,
  onPlaySound: PropTypes.func,
  isMicrophoneEnabled: PropTypes.bool,
  isMicrophoneMuted: PropTypes.bool,
  onChangeMicrophoneMuted: PropTypes.func,
  microphoneOptions: PropTypes.object,
  onChangeMicrophone: PropTypes.func,
  speakerOptions: PropTypes.object,
  onChangeSpeaker: PropTypes.func,
  isAudioInputSelectAvailable: PropTypes.bool,
  isAudioOutputSelectAvailable: PropTypes.bool,
  canVoiceChat: PropTypes.bool,
  permissionStatus: PropTypes.string
};

AudioPopoverContent.defaultProps = {
  permissionStatus: PermissionStatus.PROMPT
};
