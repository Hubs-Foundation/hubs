import React from "react";
import { Popover } from "./Popover";
import { ToolbarButton } from "../input/ToolbarButton";
import { ReactComponent as InviteIcon } from "../icons/Invite.svg";

export default {
  title: "Popover",
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
  position: "relative",
  padding: "200px"
};

export const All = args => (
  <div style={containerStyles}>
    <Popover title="Invite" content={<div style={{ padding: "8px" }}>Content</div>} initiallyVisible {...args}>
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
  </div>
);

All.parameters = {
  layout: "fullscreen"
};

All.args = {
  placement: "auto"
};
