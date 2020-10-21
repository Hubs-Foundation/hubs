import React from "react";
import { ButtonGridPopover } from "../popover/ButtonGridPopover";
import { Popover } from "../popover/Popover";
import { ToolbarButton } from "../input/ToolbarButton";
import { ReactComponent as ObjectIcon } from "../icons/Object.svg";

export function PlacePopoverButton({ items }) {
  const filteredItems = items.filter(item => !!item);

  // The button is removed if you can't place anything.
  if (filteredItems.length === 0) {
    return null;
  }

  return (
    <Popover
      title="Place"
      content={props => <ButtonGridPopover items={filteredItems} {...props} />}
      placement="top"
      offsetDistance={28}
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
  items: ButtonGridPopover.propTypes.items
};
