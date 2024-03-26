import React from "react";
import PropTypes from "prop-types";
import { ButtonGridPopover } from "../popover/ButtonGridPopover";
import { Popover } from "../popover/Popover";
import { ToolbarButton } from "../input/ToolbarButton";
import { ReactComponent as TranslateIcon } from "../icons/Translate.svg";
import { defineMessage, useIntl } from "react-intl";
import { ToolTip } from "@mozilla/lilypad-ui";

const LanguageTooltipDescription = defineMessage({
  id: "languag-tooltip.description",
  defaultMessage: "Choose your language"
});

const languagePopoverTitle = defineMessage({
  id: "languag-popover.title",
  defaultMessage: "Language"
});

export function LanguagePopover({ items }) {
  const intl = useIntl();
  const title = intl.formatMessage(languagePopoverTitle);
  const description = intl.formatMessage(LanguageTooltipDescription);

  const filteredItems = items.filter(item => !!item);

  if (filteredItems.length === 0) {
    return null;
  }

  const activeItem = filteredItems.find(item => item.active);

  if (filteredItems.length === 1 || activeItem) {
    const item = activeItem;
    const Icon = item.icon;
    return (
      <ToolbarButton
        icon={<Icon />}
        onClick={() => {
          if (item.onSelect) {
            item.onSelect(item);
          }
        }}
        label={title}
        preset="accent5"
        statusColor={activeItem && "recording"}
      />
    );
  }

  return (
    <Popover
      title={title}
      content={props => <ButtonGridPopover items={filteredItems} {...props} />}
      placement="top"
      offsetDistance={28}
      disableFullscreen
    >
      {({ togglePopover, popoverVisible, triggerRef }) => (
        <ToolTip description={description}>
          <ToolbarButton
            ref={triggerRef}
            icon={<TranslateIcon />}
            selected={popoverVisible}
            onClick={togglePopover}
            label={title}
            preset="accent5"
          />
        </ToolTip>
      )}
    </Popover>
  );
}
