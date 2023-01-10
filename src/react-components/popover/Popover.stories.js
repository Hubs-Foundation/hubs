/* eslint-disable @calm/react-intl/missing-formatted-message */
import React from "react";
import { Popover } from "./Popover";
import { ToolbarButton } from "../input/ToolbarButton";
import { ReactComponent as InviteIcon } from "../icons/Invite.svg";
import { ReactComponent as ArrowIcon } from "../icons/Arrow.svg";
import { ReactComponent as MicrophoneIcon } from "../icons/Microphone.svg";
import { Column } from "../layout/Column";

export default {
  title: "Popover/Popover",
  parameters: {
    layout: "fullscreen"
  },
  argTypes: {
    placement: {
      control: {
        type: "select",
        options: [
          "auto",
          "auto-start",
          "auto-end",
          "top",
          "top-start",
          "top-end",
          "bottom",
          "bottom-start",
          "bottom-end",
          "right",
          "right-start",
          "right-end",
          "left",
          "left-start",
          "left-end"
        ]
      }
    }
  }
};

const containerStyles = {
  width: "100%",
  height: "100%",
  position: "relative",
  padding: "200px",
  display: "flex",
  placeContent: "space-around",
  alignItems: "center"
};

const audioContainerStyles = {
  display: "flex"
};

export const All = args => (
  <div style={containerStyles}>
    <Popover title="Invite" content={<Column padding>Content</Column>} {...args}>
      {({ togglePopover, popoverVisible, triggerRef }) => (
        <ToolbarButton
          ref={triggerRef}
          icon={<InviteIcon />}
          selected={popoverVisible}
          onClick={togglePopover}
          label="Invite"
        />
      )}
    </Popover>
    <Popover title="Audio" content={<Column padding>Content</Column>} {...args}>
      {({ togglePopover, popoverVisible, triggerRef }) => (
        <div style={audioContainerStyles}>
          <ToolbarButton
            ref={triggerRef}
            icon={<ArrowIcon />}
            preset="basic"
            type={"left"}
            onClick={togglePopover}
            selected={popoverVisible}
          />
          <ToolbarButton
            icon={<MicrophoneIcon />}
            label="Voice"
            preset="basic"
            type={"right"}
            statusColor={"enabled"}
          />
        </div>
      )}
    </Popover>
  </div>
);

All.args = {
  placement: "auto"
};
