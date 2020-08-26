import React from "react";
import PropTypes from "prop-types";
import styles from "./MoreMenuPopover.scss";
import { Popover } from "../popover/Popover";
import { ToolbarButton } from "../input/ToolbarButton";
import { ReactComponent as MoreIcon } from "../icons/More.svg";

function MoreMenuItem({ item, onSelect }) {
  const Icon = item.icon;

  return (
    <li>
      {item.href ? (
        <a
          className={styles.moreMenuItemTarget}
          href={item.href}
          target={item.target || "_blank"}
          rel="noopener noreferrer"
        >
          <Icon />
          <span>{item.label}</span>
        </a>
      ) : (
        <button className={styles.moreMenuItemTarget} onClick={() => onSelect(item)}>
          <Icon />
          <span>{item.label}</span>
        </button>
      )}
    </li>
  );
}

MoreMenuItem.propTypes = {
  onSelect: PropTypes.func.isRequired,
  item: PropTypes.object.isRequired
};

function MoreMenuGroup({ group, onSelect }) {
  return (
    <li>
      <h1 className={styles.moreMenuGroupLabel}>{group.label}</h1>
      <ul className={styles.moreMenuItemList}>
        {group.items.map(item => <MoreMenuItem key={item.id} item={item} onSelect={onSelect} />)}
      </ul>
    </li>
  );
}

MoreMenuGroup.propTypes = {
  onSelect: PropTypes.func.isRequired,
  group: PropTypes.object.isRequired
};

function MoreMenuPopoverContent({ menu, onSelect }) {
  return (
    <div className={styles.moreMenuPopover}>
      <ul>{menu.map(group => <MoreMenuGroup key={group.id} group={group} onSelect={onSelect} />)}</ul>
    </div>
  );
}

MoreMenuPopoverContent.propTypes = {
  onSelect: PropTypes.func.isRequired,
  menu: PropTypes.array.isRequired
};

export function MoreMenuPopoverButton({ menu, onSelect }) {
  return (
    <Popover
      title="More"
      content={() => <MoreMenuPopoverContent menu={menu} onSelect={onSelect} />}
      placement="top"
      offsetDistance={28}
      initiallyVisible
    >
      {({ togglePopover, popoverVisible, triggerRef }) => (
        <ToolbarButton
          ref={triggerRef}
          icon={<MoreIcon />}
          selected={popoverVisible}
          onClick={togglePopover}
          label="More"
        />
      )}
    </Popover>
  );
}

MoreMenuPopoverButton.propTypes = {
  onSelect: PropTypes.func.isRequired,
  menu: PropTypes.array.isRequired
};
