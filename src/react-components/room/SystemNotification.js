import React, { memo, useCallback } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { Button } from "../input/Button";
import { IconButton } from "../input/IconButton";
import styles from "./SystemNotification.scss";
import { Row } from "../layout/Row";
import { Column } from "../layout/Column";
import { ReactComponent as CloseIcon } from "../icons/Close.svg";

export const SystemNotification = memo(({ body, link, onDismiss }) => {
  const handleOnLink = useCallback(() => {
    window.open(link);
  }, [link]);

  return (
    <Row noWrap className={styles.notification} padding="sm">
      <Column grow padding="xs" className={styles.textColumn}>
        <div className={classNames(styles.notificationText)}>{body}</div>
      </Column>
      <Column padding="xs">
        <Button sm preset="accent4" onClick={handleOnLink}>
          <span>{"Learn More"}</span>
        </Button>
      </Column>
      <Column padding="xs">
        <IconButton className={styles.closeButton} onClick={onDismiss}>
          <CloseIcon width={16} height={16} />
        </IconButton>
      </Column>
    </Row>
  );
});

SystemNotification.propTypes = {
  className: PropTypes.string,
  body: PropTypes.string,
  link: PropTypes.string,
  onDismiss: PropTypes.func
};

SystemNotification.displayName = "Notification";
