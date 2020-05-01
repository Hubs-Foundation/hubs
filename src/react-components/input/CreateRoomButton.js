import React from "react";
import classNames from "classnames";
import { FormattedMessage } from "react-intl";
import { createAndRedirectToNewHub } from "../../utils/phoenix-utils";
import styles from "../../assets/stylesheets/index.scss";

export function CreateRoomButton() {
  return (
    <button
      className={classNames(styles.primaryButton, styles.ctaButton)}
      onClick={e => {
        e.preventDefault();
        createAndRedirectToNewHub(null, null, false);
      }}
    >
      <FormattedMessage id="home.create_a_room" />
    </button>
  );
}
