import React from "react";
import PropTypes from "prop-types";
import { ButtonGridPopover } from "../popover/ButtonGridPopover";
import { Popover } from "../popover/Popover";
import { ToolbarButton } from "../input/ToolbarButton";
import { ReactComponent as ShareIcon } from "../icons/Share.svg";

export function SharePopoverButton({ items, onSelect }) {
  // The button is removed if you can't share anything.
  if (items.length === 0) {
    return undefined;
  }

  const activeItem = items.find(item => item.active);

  // If there's one item to share (your smartphone camera), or an item is active (recording), then only show that button.
  if (items.length === 1 || activeItem) {
    const item = items[0];
    const Icon = item.icon;
    return (
      <ToolbarButton
        icon={<Icon />}
        onClick={() => onSelect(item)}
        label="Share"
        preset="purple"
        statusColor={activeItem && "red"}
      />
    );
  }

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
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      icon: PropTypes.elementType.isRequired,
      color: PropTypes.string,
      name: PropTypes.string.isRequired,
      active: PropTypes.bool
    })
  ).isRequired,
  onSelect: PropTypes.func
};
