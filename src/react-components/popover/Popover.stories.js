import React from "react";
import { Popover } from "./Popover";
import { ToolbarButton } from "../toolbar/ToolbarButton";
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

export const Base = args => (
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

Base.parameters = {
  layout: "fullscreen"
};

Base.args = {
  placement: "auto"
};
