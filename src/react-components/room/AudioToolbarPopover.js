import React, { forwardRef, memo, useRef } from "react";
import PropTypes from "prop-types";
import styles from "./AudioToolbarPopover.scss";
import { Popover } from "../popover/Popover";
import { ToolbarButton } from "../input/ToolbarButton";
import { ReactComponent as ArrowIcon } from "../icons/Arrow.svg";
import { ReactComponent as MicrophoneIcon } from "../icons/Microphone.svg";
import { ReactComponent as MicrophoneMutedIcon } from "../icons/MicrophoneMuted.svg";
import { ReactComponent as VolumeHighIcon } from "../icons/VolumeHigh.svg";
import { Column } from "../layout/Column";
import { defineMessage, FormattedMessage, useIntl } from "react-intl";
import { SelectInputField } from "../input/SelectInputField";
import { Row } from "../layout/Row";
import { LevelBar } from "../misc/LevelBar";
import { ToggleInput } from "../input/ToggleInput";
import { Divider } from "../layout/Divider";
import { Button } from "../input/Button";

function AudioToolbarPopoverContent({
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
}) {
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
        <VolumeHighIcon className={iconStyle} style={{ marginRight: "12px" }} />
        <LevelBar className={styles.levelBar} level={speakerLevel} />
      </Row>
      <Button preset="basic" onClick={onPlaySound} sm>
        <FormattedMessage id="mic-setup-modal.test-audio-button" defaultMessage="Test Audio" />
      </Button>
    </Column>
  );
}

AudioToolbarPopoverContent.propTypes = {
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

const invitePopoverTitle = defineMessage({
  id: "audio-toolbar-popover.title",
  defaultMessage: "Audio Settings"
});

export const AudioToolbarPopoverButton = memo(
  forwardRef(({ initiallyVisible, ...rest }, ref) => {
    const intl = useIntl();
    const title = intl.formatMessage(invitePopoverTitle);
    const popoverApiRef = useRef();
    const { isMicrophoneMuted, isMicrophoneEnabled, onChangeMicrophoneMuted } = rest;

    return (
      <Popover
        title={title}
        content={<AudioToolbarPopoverContent {...rest} />}
        placement="top-start"
        offsetDistance={28}
        initiallyVisible={initiallyVisible}
        popoverApiRef={popoverApiRef}
      >
        {({ togglePopover, popoverVisible, triggerRef }) => (
          <div className={styles.buttonsContainer}>
            <ToolbarButton
              ref={triggerRef}
              icon={<ArrowIcon />}
              preset="basic"
              selected={popoverVisible}
              onClick={togglePopover}
              type={"left"}
              className={popoverVisible ? styles.arrowButton : styles.arrowButtonSelected}
            />
            <ToolbarButton
              ref={ref}
              icon={isMicrophoneMuted || !isMicrophoneEnabled ? <MicrophoneMutedIcon /> : <MicrophoneIcon />}
              label={<FormattedMessage id="voice-button-container.label" defaultMessage="Voice" />}
              preset="basic"
              onClick={onChangeMicrophoneMuted}
              statusColor={isMicrophoneMuted || !isMicrophoneEnabled ? "disabled" : "enabled"}
              type={"right"}
            />
          </div>
        )}
      </Popover>
    );
  })
);

AudioToolbarPopoverButton.propTypes = {
  initiallyVisible: PropTypes.bool,
  ...AudioToolbarPopoverContent.propTypes
};
