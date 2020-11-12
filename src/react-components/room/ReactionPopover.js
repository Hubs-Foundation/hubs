import React from "react";
import PropTypes from "prop-types";
import { ImageGridPopover } from "../popover/ImageGridPopover";
import { Popover } from "../popover/Popover";
import { ToolbarButton } from "../input/ToolbarButton";
import { ReactComponent as ReactionIcon } from "../icons/Reaction.svg";

export function ReactionPopoverButton({ items }) {
  return (
    <Popover
      title="React"
      content={props => <ImageGridPopover items={items} {...props} />}
      placement="top"
      offsetDistance={28}
    >
      {({ togglePopover, popoverVisible, triggerRef }) => (
        <ToolbarButton
          ref={triggerRef}
          icon={<ReactionIcon />}
          selected={popoverVisible}
          onClick={togglePopover}
          label="React"
          preset="orange"
        />
      )}
    </Popover>
  );
}

ReactionPopoverButton.propTypes = {
  items: PropTypes.array.isRequired
};
