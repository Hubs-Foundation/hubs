import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "../assets/stylesheets/presence-log.scss";
import classNames from "classnames";
import Linkify from "react-linkify";
import { toArray as toEmojis } from "react-emoji-render";
import { FormattedMessage } from "react-intl";

export default class PresenceLog extends Component {
  static propTypes = {
    entries: PropTypes.array,
    inRoom: PropTypes.bool
  };

  constructor(props) {
    super(props);
  }

  domForEntry = e => {
    const entryClasses = {
      [styles.presenceLogEntry]: true,
      [styles.expired]: !!e.expired
    };

    switch (e.type) {
      case "join":
      case "entered":
        return (
          <div key={e.key} className={classNames(entryClasses)}>
            <b>{e.name}</b> <FormattedMessage id={`presence.${e.type}_${e.presence}`} />
          </div>
        );
      case "leave":
        return (
          <div key={e.key} className={classNames(entryClasses)}>
            <b>{e.name}</b> <FormattedMessage id={`presence.${e.type}`} />
          </div>
        );
      case "display_name_changed":
        return (
          <div key={e.key} className={classNames(entryClasses)}>
            <b>{e.oldName}</b> <FormattedMessage id="presence.name_change" /> <b>{e.newName}</b>.
          </div>
        );
      case "chat":
        return (
          <div key={e.key} className={classNames(entryClasses)}>
            <b>{e.name}</b>:{" "}
            <Linkify properties={{ target: "_blank", rel: "noopener referrer" }}>{toEmojis(e.body)}</Linkify>
          </div>
        );
      case "spawn": {
        const { src } = e.body;
        return (
          <div key={e.key} className={classNames(entryClasses, styles.spawn)}>
            <a href={src} target="_blank" rel="noopener noreferrer">
              <img src={src} />
            </a>
            <b>{e.name}</b>:
            <i>
              {" took a "}
              <a href={src} target="_blank" rel="noopener noreferrer">
                photo
              </a>
            </i>
          </div>
        );
      }
    }
  };

  render() {
    const presenceClasses = {
      [styles.presenceLog]: true,
      [styles.presenceLogInRoom]: this.props.inRoom
    };

    return <div className={classNames(presenceClasses)}>{this.props.entries.map(this.domForEntry)}</div>;
  }
}
