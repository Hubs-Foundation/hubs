import React from "react";
import PropTypes from "prop-types";
import { ButtonGridPopover } from "../popover/ButtonGridPopover";
import { Popover } from "../popover/Popover";
import { ToolbarButton } from "../input/ToolbarButton";
import { ReactComponent as ObjectIcon } from "../icons/Object.svg";

export function PlacePopoverButton({ items, onSelect }) {
  return (
    <Popover
      title="Place"
      content={props => <ButtonGridPopover items={items} onSelect={onSelect} {...props} />}
      placement="top"
      offsetDistance={28}
      initiallyVisible
    >
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
  );
}

PlacePopoverButton.propTypes = {
  items: ButtonGridPopover.propTypes.items,
  onSelect: PropTypes.func
};
