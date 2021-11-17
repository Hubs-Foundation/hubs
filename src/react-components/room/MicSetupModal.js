import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { Modal } from "../modal/Modal";
import { Button } from "../input/Button";
import { ReactComponent as MicrophoneIcon } from "../icons/Microphone.svg";
import { ReactComponent as MicrophoneMutedIcon } from "../icons/MicrophoneMuted.svg";
import { ReactComponent as VolumeHighIcon } from "../icons/VolumeHigh.svg";
import { ReactComponent as HelpIcon } from "../icons/Help.svg";
import styles from "./MicSetupModal.scss";
import { BackButton } from "../input/BackButton";
import { SelectInputField } from "../input/SelectInputField";
import { ToggleInput } from "../input/ToggleInput";
import { Column } from "../layout/Column";
import { FormattedMessage } from "react-intl";
import { LevelBar } from "../misc/LevelBar";
import { Popover } from "../popover/Popover";
import { Icon } from "../misc/Icon";

export function MicSetupModal({
  className,
  selectedMicrophone,
  microphoneOptions,
  onChangeMicrophone,
  selectedSpeaker,
  speakerOptions,
  onChangeSpeaker,
  microphoneEnabled,
  micLevel,
  speakerLevel,
  soundPlaying,
  onPlaySound,
  microphoneMuted,
  onChangeMicrophoneMuted,
  onEnableMicrophone,
  onEnterRoom,
  onBack,
  permissionsGranted,
  ...rest
}) {
  return (
    <Modal
      title={<FormattedMessage id="mic-setup-modal.title" defaultMessage="Microphone Setup" />}
      beforeTitle={<BackButton onClick={onBack} />}
      className={className}
      {...rest}
    >
      <Column center padding className={styles.content}>
        <p>
          <FormattedMessage
            id="mic-setup-modal.check-mic"
            defaultMessage="Check your microphone and audio before entering."
          />
        </p>
        <div className={styles.audioCheckContainer}>
          <div className={styles.audioIoContainer}>
            <div
              className={classNames(styles.iconContainer, microphoneEnabled ? styles.iconEnabled : styles.iconDisabled)}
            >
              {permissionsGranted && microphoneEnabled && !microphoneMuted ? (
                <MicrophoneIcon />
              ) : (
                <MicrophoneMutedIcon />
              )}
              <LevelBar width={48} height={48} level={!microphoneEnabled || microphoneMuted ? 0 : micLevel} />
            </div>
            <div className={styles.actionContainer}>
              {permissionsGranted && microphoneEnabled ? (
                <>
                  <ToggleInput
                    label={<FormattedMessage id="mic-setup-modal.mute-mic-toggle-v2" defaultMessage="Mute" />}
                    checked={microphoneMuted}
                    onChange={onChangeMicrophoneMuted}
                  />
                  <Popover
                    title="Info"
                    content={
                      <Column className={styles.popoverContent}>
                        <FormattedMessage
                          id="mic-setup-modal.mute-mic-info"
                          defaultMessage="You can mute anytime after you enter the room"
                        />
                      </Column>
                    }
                    placement="top"
                    showHeader={false}
                    disableFullscreen
                    popoverClass={styles.popover}
                    arrowClass={styles.popoverArrow}
                  >
                    {({ openPopover, closePopover, triggerRef }) => (
                      <Icon
                        ref={triggerRef}
                        icon={<HelpIcon />}
                        onMouseEnter={openPopover}
                        onMouseLeave={closePopover}
                      />
                    )}
                  </Popover>
                </>
              ) : (
                (permissionsGranted && (
                  <Button preset="primary" onClick={onEnableMicrophone} sm>
                    <FormattedMessage id="mic-setup-modal.enable-mic-button" defaultMessage="Enable Microphone" />
                  </Button>
                )) || (
                  <p className={styles.errorText}>
                    <FormattedMessage
                      id="mic-setup-modal.mic-pernissions"
                      defaultMessage="You need to enable the microphone access"
                    />
                  </p>
                )
              )}
            </div>
            {permissionsGranted &&
              microphoneEnabled && (
                <div className={styles.selectionContainer}>
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
                </div>
              )}
          </div>
          <div className={styles.audioIoContainer}>
            <div className={classNames(styles.iconContainer, styles.iconEnabled)}>
              <VolumeHighIcon style={{ marginRight: "5px" }} />
              <LevelBar width={48} height={48} level={soundPlaying ? speakerLevel : 0} />
            </div>
            <div className={styles.actionContainer}>
              <Button preset="basic" onClick={onPlaySound} sm>
                <FormattedMessage id="mic-setup-modal.test-audio-button" defaultMessage="Test Audio" />
              </Button>
            </div>
            {permissionsGranted &&
              speakerOptions?.length > 0 && (
                <div className={styles.selectionContainer}>
                  <p style={{ alignSelf: "start" }}>
                    <FormattedMessage id="mic-setup-modal.speakers-text" defaultMessage="Speakers" />
                  </p>
                  <SelectInputField
                    value={selectedSpeaker}
                    options={speakerOptions}
                    onChange={onChangeSpeaker}
                    className={styles.selectionInput}
                    buttonClassName={styles.selectionInput}
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
  soundPlaying: PropTypes.bool,
  onPlaySound: PropTypes.func,
  micLevel: PropTypes.number,
  speakerLevel: PropTypes.number,
  microphoneEnabled: PropTypes.bool,
  microphoneMuted: PropTypes.bool,
  onChangeMicrophoneMuted: PropTypes.func,
  selectedMicrophone: PropTypes.string,
  microphoneOptions: PropTypes.array,
  onChangeMicrophone: PropTypes.func,
  onEnableMicrophone: PropTypes.func,
  selectedSpeaker: PropTypes.string,
  speakerOptions: PropTypes.array,
  onChangeSpeaker: PropTypes.func,
  onEnterRoom: PropTypes.func,
  onBack: PropTypes.func,
  permissionsGranted: PropTypes.bool
};

MicSetupModal.defaultProps = {
  micLevel: 0,
  speakerLevel: 0,
  permissionsGranted: true
};
