import React from "react";
import PropTypes from "prop-types";
import { Modal } from "../modal/Modal";
import { Button } from "../input/Button";
import { ReactComponent as MicrophoneIcon } from "../icons/Microphone.svg";
import { ReactComponent as MicrophoneMutedIcon } from "../icons/MicrophoneMuted.svg";
import { ReactComponent as VolumeOffIcon } from "../icons/VolumeOff.svg";
import { ReactComponent as InfoIcon } from "../icons/Info.svg";
import styles from "./MicSetupModal.scss";
import { BackButton } from "../input/BackButton";
import { SelectInputField } from "../input/SelectInputField";
import { ToggleInput } from "../input/ToggleInput";
import { Column } from "../layout/Column";
import { defineMessages, FormattedMessage, useIntl } from "react-intl";
import { PermissionStatus } from "../../utils/media-devices-utils";
import { Spinner } from "../misc/Spinner";
import { ToolTip } from "@mozilla/lilypad-ui";

export const titleMessages = defineMessages({
  microphoneSetup: {
    id: "mic-setup-modal.title",
    defaultMessage: "Microphone Setup"
  },
  audioSetup: {
    id: "mic-setup-modal.title-audio",
    defaultMessage: "Audio Setup"
  }
});

export function MicSetupModal({
  className,
  microphoneOptions,
  onChangeMicrophone,
  speakerOptions,
  onChangeSpeaker,
  isMicrophoneEnabled,
  onPlaySound,
  isMicrophoneMuted,
  onChangeMicrophoneMuted,
  onEnterRoom,
  onBack,
  permissionStatus,
  isAudioInputSelectAvailable,
  isAudioOutputSelectAvailable,
  micLevelBar,
  speakerLevelBar,
  canVoiceChat,
  ...rest
}) {
  const iconStyle = isMicrophoneEnabled ? styles.iconEnabled : styles.iconDisabled;
  const intl = useIntl();
  return (
    <Modal
      title={intl.formatMessage(titleMessages[canVoiceChat ? "microphoneSetup" : "audioSetup"])}
      beforeTitle={<BackButton onClick={onBack} />}
      className={className}
      {...rest}
    >
      <Column center padding grow className={styles.content}>
        <p>
          <FormattedMessage
            id="mic-setup-modal.check-mic"
            defaultMessage="Check your microphone and audio before entering."
          />
        </p>
        <div className={styles.audioCheckContainer}>
          <div className={styles.audioIoContainer}>
            {(canVoiceChat && (
              <>
                <div className={styles.iconContainer}>
                  <div>
                    {permissionStatus === PermissionStatus.PROMPT && (
                      <div className={styles.spinnerContainer}>
                        <Spinner />
                      </div>
                    )}
                    {permissionStatus === PermissionStatus.GRANTED && isMicrophoneEnabled && !isMicrophoneMuted ? (
                      <MicrophoneIcon className={iconStyle} />
                    ) : (
                      <MicrophoneMutedIcon className={iconStyle} />
                    )}
                  </div>
                  {permissionStatus === PermissionStatus.GRANTED && <> {micLevelBar}</>}
                </div>
                <div className={styles.actionContainer}>
                  {permissionStatus === PermissionStatus.GRANTED ? (
                    <>
                      <ToggleInput
                        label={<FormattedMessage id="mic-setup-modal.mute-mic-toggle-v2" defaultMessage="Mute" />}
                        checked={isMicrophoneMuted}
                        onChange={onChangeMicrophoneMuted}
                      />
                      <ToolTip
                        location="right"
                        category="primary"
                        description="Toggle mic on/off anytime after you enter the room (M)"
                      >
                        <InfoIcon className={styles.infoIcon} />
                      </ToolTip>
                    </>
                  ) : (
                    (permissionStatus === PermissionStatus.PROMPT && (
                      <p>
                        <FormattedMessage
                          id="mic-setup-modal.mic-permission-prompt"
                          defaultMessage="Requesting access to your microphone..."
                        />
                      </p>
                    )) ||
                    (permissionStatus === PermissionStatus.DENIED && (
                      <p>
                        <span className={styles.errorTitle}>
                          <FormattedMessage
                            id="mic-setup-modal.error-title"
                            defaultMessage="Microphone access was blocked."
                            className={styles.errorTitle}
                          />
                        </span>{" "}
                        <FormattedMessage
                          id="mic-setup-modal.error-description"
                          defaultMessage="To talk in Hubs you will need to allow microphone access."
                        />
                      </p>
                    ))
                  )}
                </div>
                {permissionStatus === PermissionStatus.GRANTED && isAudioInputSelectAvailable && (
                  <div className={styles.selectionContainer}>
                    <p style={{ alignSelf: "start" }}>
                      <FormattedMessage id="mic-setup-modal.microphone-text" defaultMessage="Microphone" />
                    </p>
                    <SelectInputField
                      className={styles.selectionInput}
                      buttonClassName={styles.selectionInput}
                      onChange={onChangeMicrophone}
                      {...microphoneOptions}
                    />
                  </div>
                )}
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
          </div>
          <div className={styles.audioIoContainer}>
            <div className={styles.iconContainer}>
              <VolumeOffIcon className={styles.iconEnabled} style={{ marginRight: "5px" }} />
              <> {speakerLevelBar} </>
            </div>
            <div className={styles.actionContainer}>
              <Button preset="basic" onClick={onPlaySound} sm>
                <FormattedMessage id="mic-setup-modal.test-audio-button" defaultMessage="Test Audio" />
              </Button>
            </div>
            {permissionStatus === PermissionStatus.GRANTED && isAudioOutputSelectAvailable && (
              <div className={styles.selectionContainer}>
                <p style={{ alignSelf: "start" }}>
                  <FormattedMessage id="mic-setup-modal.speakers-text" defaultMessage="Speakers" />
                </p>
                <SelectInputField
                  onChange={onChangeSpeaker}
                  className={styles.selectionInput}
                  buttonClassName={styles.selectionInput}
                  {...speakerOptions}
                />
              </div>
            )}
          </div>
        </div>
        <Button preset="primary" onClick={onEnterRoom}>
          <FormattedMessage id="mic-setup-modal.enter-room-button" defaultMessage="Enter Room" />
        </Button>
      </Column>
    </Modal>
  );
}

MicSetupModal.propTypes = {
  className: PropTypes.string,
  onPlaySound: PropTypes.func,
  micLevelBar: PropTypes.node,
  speakerLevelBar: PropTypes.node,
  isMicrophoneEnabled: PropTypes.bool,
  isMicrophoneMuted: PropTypes.bool,
  onChangeMicrophoneMuted: PropTypes.func,
  microphoneOptions: PropTypes.object,
  onChangeMicrophone: PropTypes.func,
  speakerOptions: PropTypes.object,
  onChangeSpeaker: PropTypes.func,
  onEnterRoom: PropTypes.func,
  onBack: PropTypes.func,
  permissionStatus: PropTypes.string,
  isAudioInputSelectAvailable: PropTypes.bool,
  isAudioOutputSelectAvailable: PropTypes.bool,
  canVoiceChat: PropTypes.bool
};

MicSetupModal.defaultProps = {
  permissionStatus: PermissionStatus.PROMPT
};
