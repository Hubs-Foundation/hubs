import React from "react";
import PropTypes from "prop-types";
import { ButtonGridPopover } from "../popover/ButtonGridPopover";
import { Popover } from "../popover/Popover";
import { ToolbarButton } from "../input/ToolbarButton";
import { ReactComponent as ShareIcon } from "../icons/Share.svg";

export function SharePopoverButton({ items, onSelect }) {
  return (
    <Popover
      title="Share"
      content={props => <ButtonGridPopover items={items} onSelect={onSelect} {...props} />}
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
  );
}

SharePopoverButton.propTypes = {
  items: ButtonGridPopover.propTypes.items,
  onSelect: PropTypes.func
};
