import React from "react";
import PropTypes from "prop-types";
import { ButtonGridPopover } from "../popover/ButtonGridPopover";
import { Popover } from "../popover/Popover";
import { ToolbarButton } from "../input/ToolbarButton";
import { ReactComponent as ObjectIcon } from "../icons/Object.svg";
import { defineMessage, useIntl } from "react-intl";

const placePopoverTitle = defineMessage({
  id: "place-popover.title",
  defaultMessage: "Place"
});

export function PlacePopoverButton({ items }) {
  const intl = useIntl();
  const filteredItems = items.filter(item => !!item);

  // The button is removed if you can't place anything.
  if (filteredItems.length === 0) {
    return null;
  }

  const title = intl.formatMessage(placePopoverTitle);

  return (
    <Popover
      title={title}
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
          label={title}
          preset="accent3"
        />
      )}
    </Popover>
  );
}

PlacePopoverButton.propTypes = {
  items: PropTypes.array.isRequired
};
