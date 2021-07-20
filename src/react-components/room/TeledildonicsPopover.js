import React from "react";
import PropTypes from "prop-types";
import { ListGridPopover } from "../popover/ListGridPopover";
import { Popover } from "../popover/Popover";
import { ToolbarButton } from "../input/ToolbarButton";
import { ReactComponent as TeledildonicsIcon } from "../icons/Teledildonics.svg";
import { defineMessage, useIntl } from "react-intl";

const reactionPopoverTitle = defineMessage({
  id: "reaction-popover.title",
  defaultMessage: "Teledildonics"
});

export function TeledildonicsPopoverButton({ items }) {
  const intl = useIntl();
  const title = intl.formatMessage(reactionPopoverTitle);

  return (
    <Popover
      title={title}
      content={props => <ListGridPopover items={items} {...props} />}
      placement="top"
      offsetDistance={28}
    >
      {({ togglePopover, popoverVisible, triggerRef }) => (
        <ToolbarButton
          ref={triggerRef}
          icon={<TeledildonicsIcon />}
          selected={popoverVisible}
          onClick={togglePopover}
          //label={title}
          preset="tele"
          className="tele"
        />
      )}
    </Popover>
  );
}

TeledildonicsPopoverButton.propTypes = {
  items: PropTypes.array.isRequired
};
