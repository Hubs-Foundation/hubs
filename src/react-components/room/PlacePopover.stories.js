import React from "react";
import { Popover } from "../popover/Popover";
import { ToolbarButton } from "../input/ToolbarButton";
import { RoomLayout } from "../layout/RoomLayout";
import { ReactComponent as ObjectIcon } from "../icons/Object.svg";
import { PlacePopover } from "./PlacePopover";

export default {
  title: "PlacePopover"
};

export const Base = () => (
  <RoomLayout
    toolbarCenter={
      <Popover title="Place" content={PlacePopover} placement="top" offsetDistance={28} initiallyVisible>
        {({ togglePopover, popoverVisible, triggerRef }) => (
          <ToolbarButton
            ref={triggerRef}
            icon={<ObjectIcon />}
            selected={popoverVisible}
            onClick={togglePopover}
            label="Place"
            preset="green"
          />
        )}
      </Popover>
    }
  />
);

Base.parameters = {
  layout: "fullscreen"
};
