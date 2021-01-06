import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { joinChildren } from "../misc/joinChildren";
import styles from "./ObjectMenu.scss";
import { IconButton } from "../input/IconButton";
import { ReactComponent as CloseIcon } from "../icons/Close.svg";
import { ReactComponent as ChevronBackIcon } from "../icons/ChevronBack.svg";
import { ReactComponent as ArrowBackIcon } from "../icons/ArrowBack.svg";
import { ReactComponent as ArrowForwardIcon } from "../icons/ArrowForward.svg";
import { ReactComponent as LightbulbIcon } from "../icons/Lightbulb.svg";
import { ReactComponent as LightbulbOutlineIcon } from "../icons/LightbulbOutline.svg";

export function ObjectMenuButton({ children, className, ...rest }) {
  return (
    <IconButton compactSm className={classNames(styles.objectMenuButton, className)} {...rest}>
      {children}
    </IconButton>
  );
}

ObjectMenuButton.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
};

export function ObjectMenu({
  children,
  title,
  onClose,
  onBack,
  onPrevObject,
  onNextObject,
  currentObjectIndex,
  objectCount,
  onToggleLights,
  lightsEnabled
}) {
  return (
    <>
      <IconButton className={styles.backButton} onClick={onBack}>
        <ChevronBackIcon width={24} height={24} />
      </IconButton>
      <IconButton className={styles.lightsButton} onClick={onToggleLights}>
        {lightsEnabled ? (
          <LightbulbOutlineIcon title="Turn Lights Off" width={24} height={24} />
        ) : (
          <LightbulbIcon title="Turn Lights On" width={24} height={24} />
        )}
      </IconButton>
      <div className={styles.objectMenuContainer}>
        <div className={styles.objectMenu}>
          <div className={styles.header}>
            <IconButton className={styles.closeButton} onClick={onClose}>
              <CloseIcon width={16} height={16} />
            </IconButton>
            <h5>{title}</h5>
            <IconButton className={styles.lightsHeaderButton} onClick={onToggleLights}>
              {lightsEnabled ? (
                <LightbulbOutlineIcon title="Turn Lights Off" width={16} height={16} />
              ) : (
                <LightbulbIcon title="Turn Lights On" width={16} height={16} />
              )}
            </IconButton>
          </div>
          <div className={styles.menu}>{joinChildren(children, () => <div className={styles.separator} />)}</div>
        </div>
        <div className={styles.pagination}>
          <IconButton onClick={onPrevObject}>
            <ArrowBackIcon width={24} height={24} />
          </IconButton>
          <p>
            {currentObjectIndex + 1}/{objectCount}
          </p>
          <IconButton onClick={onNextObject}>
            <ArrowForwardIcon width={24} height={24} />
          </IconButton>
        </div>
      </div>
    </>
  );
}

ObjectMenu.propTypes = {
  currentObjectIndex: PropTypes.number.isRequired,
  objectCount: PropTypes.number.isRequired,
  onPrevObject: PropTypes.func,
  onNextObject: PropTypes.func,
  children: PropTypes.node,
  title: PropTypes.node,
  onClose: PropTypes.func,
  onBack: PropTypes.func,
  onToggleLights: PropTypes.func,
  lightsEnabled: PropTypes.bool
};
