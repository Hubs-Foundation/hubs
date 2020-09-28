import React from "react";
import PropTypes from "prop-types";
import styles from "./MoreMenuPopover.scss";
import { Popover } from "../popover/Popover";
import { ToolbarButton } from "../input/ToolbarButton";
import { ReactComponent as MoreIcon } from "../icons/More.svg";

function MoreMenuItem({ item }) {
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
        <button className={styles.moreMenuItemTarget} onClick={event => item.onClick(item, event)}>
          <Icon />
          <span>{item.label}</span>
        </button>
      )}
    </li>
  );
}

MoreMenuItem.propTypes = {
  item: PropTypes.shape({
    href: PropTypes.string,
    target: PropTypes.string,
    icon: PropTypes.elementType.isRequired,
    label: PropTypes.node.isRequired,
    onClick: PropTypes.func
  }).isRequired
};

function MoreMenuGroup({ group }) {
  return (
    <li>
      <h1 className={styles.moreMenuGroupLabel}>{group.label}</h1>
      <ul className={styles.moreMenuItemList}>{group.items.map(item => <MoreMenuItem key={item.id} item={item} />)}</ul>
    </li>
  );
}

MoreMenuGroup.propTypes = {
  group: PropTypes.object.isRequired
};

function MoreMenuPopoverContent({ menu }) {
  return (
    <div className={styles.moreMenuPopover}>
      <ul>{menu.map(group => <MoreMenuGroup key={group.id} group={group} />)}</ul>
    </div>
  );
}

MoreMenuPopoverContent.propTypes = {
  menu: PropTypes.array.isRequired
};

export function MoreMenuPopoverButton({ menu, initiallyVisible }) {
  return (
    <Popover
      title="More"
      content={() => <MoreMenuPopoverContent menu={menu} />}
      placement="top-end"
      offsetDistance={28}
      initiallyVisible={initiallyVisible}
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
  initiallyVisible: PropTypes.bool,
  menu: PropTypes.array.isRequired
};
