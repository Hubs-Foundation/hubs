import React, { useCallback, useRef } from "react";
import PropTypes from "prop-types";
import styles from "./AudioPopover.scss";
import { Popover } from "../popover/Popover";
import { ToolbarButton } from "../input/ToolbarButton";
import { ReactComponent as ArrowIcon } from "../icons/Arrow.svg";
import { ReactComponent as MicrophoneIcon } from "../icons/Microphone.svg";
import { ReactComponent as MicrophoneMutedIcon } from "../icons/MicrophoneMuted.svg";
import { defineMessage, FormattedMessage, useIntl } from "react-intl";

const invitePopoverTitle = defineMessage({
  id: "audio-toolbar-popover.title",
  defaultMessage: "Audio Settings"
});

export const AudioPopoverButton = ({
  initiallyVisible,
  content,
  isMicrophoneMuted,
  isMicrophoneEnabled,
  micLevel,
  onChangeMicrophoneMuted
}) => {
  const intl = useIntl();
  const title = intl.formatMessage(invitePopoverTitle);
  const popoverApiRef = useRef();
  const micButtonRef = useCallback(
    node => {
      if (node !== null) {
        const rect = node.querySelector("rect");
        if (micLevel <= 0.1) {
          rect.setAttribute("height", 0);
        } else if (micLevel < 0.3) {
          rect.setAttribute("y", 8);
          rect.setAttribute("height", 4);
        } else {
          rect.setAttribute("y", 4);
          rect.setAttribute("height", 8);
        }
      }
    },
    [micLevel]
  );

  return (
    <Popover
      title={title}
      content={content}
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
            title={"Audio Settings"}
          />
          <ToolbarButton
            ref={micButtonRef}
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
};

AudioPopoverButton.propTypes = {
  initiallyVisible: PropTypes.bool,
  isMicrophoneMuted: PropTypes.bool,
  isMicrophoneEnabled: PropTypes.bool,
  micLevel: PropTypes.number,
  onChangeMicrophoneMuted: PropTypes.func,
  content: PropTypes.element
};
