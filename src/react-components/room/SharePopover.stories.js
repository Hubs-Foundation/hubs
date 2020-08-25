import React from "react";
import { Popover } from "../popover/Popover";
import { ToolbarButton } from "../input/ToolbarButton";
import { RoomLayout } from "../layout/RoomLayout";
import { ReactComponent as ShareIcon } from "../icons/Share.svg";
import { SharePopover } from "./SharePopover";
import { RoomContext } from "./RoomContext";

export default {
  title: "SharePopover"
};

const roomContextMock = {
  url: "hubs.link/oggNnrN",
  code: "478816",
  embed:
    '<iframe src="https://hubs.mozilla.com/oggNnrN/handsome-famous-park?embed_token=5555555555555555555555555" style="width: 1024px; height: 768px;" allow="microphone; camera; vr; speaker;"></iframe>'
};

export const Base = () => (
  <RoomContext.Provider value={roomContextMock}>
    <RoomLayout
      toolbarCenter={
        <Popover
          title="Share"
          content={SharePopover}
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
  </RoomContext.Provider>
);

Base.parameters = {
  layout: "fullscreen"
};
