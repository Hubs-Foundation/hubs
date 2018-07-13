import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import queryString from "query-string";

import styles from "../assets/stylesheets/2d-hud.scss";

import FontAwesomeIcon from "@fortawesome/react-fontawesome";
import faPlus from "@fortawesome/fontawesome-free-solid/faPlus";

const qs = queryString.parse(location.search);
function qsTruthy(param) {
  const val = qs[param];
  // if the param exists but is not set (e.g. "?foo&bar"), its value is null.
  return val === null || /1|on|true/i.test(val);
}
const enableMediaTools = qsTruthy("mediaTools");

const TwoDHUD = ({
  muted,
  frozen,
  spacebubble,
  onToggleMute,
  onToggleFreeze,
  onToggleSpaceBubble,
  onClickAddMedia
}) => (
  <div className={styles.container}>
    <div className={cx("ui-interactive", styles.panel, styles.left)}>
      <div
        className={cx(styles.iconButton, styles.mute, { [styles.active]: muted })}
        title={muted ? "Unmute Mic" : "Mute Mic"}
        onClick={onToggleMute}
      />
    </div>
    <div
      className={cx("ui-interactive", styles.iconButton, styles.large, styles.freeze, { [styles.active]: frozen })}
      title={frozen ? "Resume" : "Pause"}
      onClick={onToggleFreeze}
    />
    <div className={cx("ui-interactive", styles.panel, styles.right)}>
      <div
        className={cx(styles.iconButton, styles.bubble, { [styles.active]: spacebubble })}
        title={spacebubble ? "Disable Bubble" : "Enable Bubble"}
        onClick={onToggleSpaceBubble}
      />
    </div>
    {enableMediaTools ? (
      <div
        className={cx("ui-interactive", styles.iconButton, styles.small, styles.addMediaButton)}
        title="Add Media"
        onClick={onClickAddMedia}
      >
        <FontAwesomeIcon icon={faPlus} />
      </div>
    ) : null}
  </div>
);

TwoDHUD.propTypes = {
  muted: PropTypes.bool,
  frozen: PropTypes.bool,
  spacebubble: PropTypes.bool,
  onToggleMute: PropTypes.func,
  onToggleFreeze: PropTypes.func,
  onToggleSpaceBubble: PropTypes.func,
  onClickAddMedia: PropTypes.func
};

export default TwoDHUD;
