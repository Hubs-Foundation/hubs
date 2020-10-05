import React from "react";
import PropTypes from "prop-types";
import styles from "./PeopleSidebar.scss";
import { Sidebar } from "../sidebar/Sidebar";
import { IconButton } from "../input/IconButton";
import { ReactComponent as CloseIcon } from "../icons/Close.svg";

export function PeopleSidebar({ people, onClose }) {
  return (
    <Sidebar
      title={`People (${people.length})`}
      beforeTitle={
        <IconButton className={styles.closeButton} onClick={onClose}>
          <CloseIcon width={16} height={16} />
        </IconButton>
      }
      afterTitle={
        <IconButton className={styles.muteAllButton} onClick={onClose}>
          Mute All
        </IconButton>
      }
    />
  );
}

PeopleSidebar.propTypes = {
  people: PropTypes.array,
  onClose: PropTypes.func
};
