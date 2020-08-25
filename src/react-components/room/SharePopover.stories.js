import React from "react";
import { Popover } from "../popover/Popover";
import { ToolbarButton } from "../input/ToolbarButton";
import { RoomLayout } from "../layout/RoomLayout";
import { ReactComponent as ShareIcon } from "../icons/Share.svg";
import { ReactComponent as VideoIcon } from "../icons/Video.svg";
import { ReactComponent as DesktopIcon } from "../icons/Desktop.svg";
import { ButtonGridPopover } from "../popover/ButtonGridPopover";

export default {
  title: "SharePopover"
};

const items = [
  { id: "camera", icon: VideoIcon, color: "purple", label: "Camera" },
  { id: "screen", icon: DesktopIcon, color: "purple", label: "Screen" }
];

export const Base = () => (
  <RoomLayout
    toolbarCenter={
      <Popover
        title="Share"
        content={props => <ButtonGridPopover items={items} onSelect={item => console.log(item)} {...props} />}
        placement="top"
        offsetDistance={28}
        initiallyVisible
        disableFullscreen
      >
        {({ togglePopover, popoverVisible, triggerRef }) => (
          <ToolbarButton
            ref={triggerRef}
            icon={<ShareIcon />}
            selected={popoverVisible}
            onClick={togglePopover}
            label="Share"
            preset="purple"
          />
        )}
      </Popover>
    }
  />
);

Base.parameters = {
  layout: "fullscreen"
};
