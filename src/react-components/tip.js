import React, { Component } from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import classNames from "classnames";
import styles from "../assets/stylesheets/tip.scss";
import { faTimes } from "@fortawesome/free-solid-svg-icons/faTimes";
import { handleTipClose } from "../systems/tips.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default class Tip extends Component {
  static propTypes = {
    history: PropTypes.object,
    tip: PropTypes.string,
    tipRegion: PropTypes.string,
    broadcastTarget: PropTypes.string,
    pushHistoryState: PropTypes.func,
    onClose: PropTypes.func
  };

  render() {
    const { tip, tipRegion, broadcastTarget, pushHistoryState } = this.props;
    const rootStyles = [styles.tipRoot];
    let tipBody;

    if ([".spawn_menu", "_button"].find(x => tip.endsWith(x))) {
      rootStyles.push(styles.tourTipRoot);
      tipBody = (
        <div className={styles.splitTip}>
          <FormattedMessage id={`tips.${tip}-pre`} />
          <div
            className={classNames({
              [styles.splitTipIcon]: true,
              [styles[tip.split(".")[1] + "-icon"]]: true
            })}
          />
          <FormattedMessage id={`tips.${tip}-post`} />
        </div>
      );
    } else if (tip === "discord") {
      tipBody = (
        <div className={styles.tip}>
          <span>{`Chat in this room is being bridged to ${broadcastTarget} on Discord.`}</span>
        </div>
      );
    } else if (tip === "embed") {
      tipBody = (
        <div className={styles.tip}>
          <FormattedMessage id="embed.presence-warning" />
        </div>
      );
    } else if (tip.endsWith(".feedback")) {
      tipBody = (
        <div className={styles.tip}>
          <FormattedMessage id={`tips.${tip}`} />
          &nbsp;
          <button
            className={styles.tipLink}
            onClick={() => {
              handleTipClose(tip, tipRegion);
              pushHistoryState("modal", "feedback");
            }}
          >
            <FormattedMessage id={`tips.${tip}-link`} />
          </button>
        </div>
      );
    } else {
      rootStyles.push(styles.tourTipRoot);
      tipBody = (
        <div className={styles.tip}>
          <FormattedMessage id={`tips.${tip}`} />
        </div>
      );
    }

    return (
      <div className={classNames(rootStyles)}>
        <button
          aria-label="Close"
          className={styles.tipCancel}
          onClick={() => (this.props.onClose ? this.props.onClose(tip, tipRegion) : handleTipClose(tip, tipRegion))}
        >
          <i>
            <FontAwesomeIcon icon={faTimes} />
          </i>
        </button>
        {tipBody}
      </div>
    );
  }
}
