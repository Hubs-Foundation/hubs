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
import { FormattedMessage } from "react-intl";
import { Popover } from "../popover/Popover";
import { PermissionStatus } from "../../utils/media-devices-utils";
import { Spinner } from "../misc/Spinner";

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
  ...rest
}) {
  const iconStyle = isMicrophoneEnabled ? styles.iconEnabled : styles.iconDisabled;
  return (
    <Modal
      title={<FormattedMessage id="mic-setup-modal.title" defaultMessage="�}�C�N�ݒ�" />}
      beforeTitle={<BackButton onClick={onBack} />}
      className={className}
      {...rest}
    >
      <Column center padding grow className={styles.content}>
        <p>
          <FormattedMessage
            id="mic-setup-modal.check-mic"
            defaultMessage="�~���[�g�ݒ���m�F���Ă�������"
          />
        </p>
        <div className={styles.audioCheckContainer}>
          <div className={styles.audioIoContainer}>
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
                    label={<FormattedMessage id="mic-setup-modal.mute-mic-toggle-v2" defaultMessage="�~���[�g" />}
                    checked={isMicrophoneMuted}
                    onChange={onChangeMicrophoneMuted}
                  />
                  <Popover
                    title="Info"
                    content={
                      <Column className={styles.popoverContent}>
                        <FormattedMessage
                          id="mic-setup-modal.mute-mic-info"
                          defaultMessage="������~���[�g�ɂł��܂�"
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
                      <div ref={triggerRef}>
                        <InfoIcon className={styles.infoIcon} onMouseEnter={openPopover} onMouseLeave={closePopover} />
                      </div>
                    )}
                  </Popover>
                </>
              ) : (
                (permissionStatus === PermissionStatus.PROMPT && (
                  <p>
                    <FormattedMessage
                      id="mic-setup-modal.mic-permission-prompt"
                      defaultMessage="�}�C�N�ǂݍ��ݒ�"
                    />
                  </p>
                )) ||
                (permissionStatus === PermissionStatus.DENIED && (
                  <p>
                    <span className={styles.errorTitle}>
                      <FormattedMessage
                        id="mic-setup-modal.error-title"
                        defaultMessage="�}�C�N�ɃA�N�Z�X�ł��܂���ł���"
                        className={styles.errorTitle}
                      />
                    </span>{" "}
                    <FormattedMessage
                      id="mic-setup-modal.error-description"
                      defaultMessage="�ʘb����ɂ̓}�C�N�̎g�p��������K�v������܂��B"
                    />
                  </p>
                ))
              )}
            </div>
            {permissionStatus === PermissionStatus.GRANTED &&
              isAudioInputSelectAvailable && (
                <div className={styles.selectionContainer}>
                  <p style={{ alignSelf: "start" }}>
                    <FormattedMessage id="mic-setup-modal.microphone-text" defaultMessage="�}�C�N" />
                  </p>
                  <SelectInputField
                    className={styles.selectionInput}
                    buttonClassName={styles.selectionInput}
                    onChange={onChangeMicrophone}
                    {...microphoneOptions}
                  />
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
                <FormattedMessage id="mic-setup-modal.test-audio-button" defaultMessage="�I�[�f�B�I�e�X�g" />
              </Button>
            </div>
            {permissionStatus === PermissionStatus.GRANTED &&
              isAudioOutputSelectAvailable && (
                <div className={styles.selectionContainer}>
                  <p style={{ alignSelf: "start" }}>
                    <FormattedMessage id="mic-setup-modal.speakers-text" defaultMessage="�X�s�[�J�[�ݒ�" />
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
          <FormattedMessage id="mic-setup-modal.enter-room-button" defaultMessage="���[���ɓ���" />
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
  isAudioOutputSelectAvailable: PropTypes.bool
};

MicSetupModal.defaultProps = {
  permissionStatus: PermissionStatus.PROMPT
};