import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "../assets/stylesheets/presence-log.scss";
import classNames from "classnames";
import { FormattedMessage } from "react-intl";
import ChatMessage from "./chat-message";

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
      [styles.presenceLogEntryWithButton]: e.type === "chat" && e.maySpawn,
      [styles.presenceLogChat]: e.type === "chat",
      [styles.expired]: !!e.expired
    };

    switch (e.type) {
      case "join":
      case "entered":
        return (
          <div key={e.key} className={classNames(entryClasses)}>
            <b>{e.name}</b>&nbsp;<FormattedMessage id={`presence.${e.type}_${e.presence}`} />
          </div>
        );
      case "leave":
        return (
          <div key={e.key} className={classNames(entryClasses)}>
            <b>{e.name}</b>&nbsp;<FormattedMessage id={`presence.${e.type}`} />
          </div>
        );
      case "display_name_changed":
        return (
          <div key={e.key} className={classNames(entryClasses)}>
            <b>{e.oldName}</b>&nbsp;<FormattedMessage id="presence.name_change" />&nbsp;<b>{e.newName}</b>.
          </div>
        );
      case "chat":
        return (
          <ChatMessage
            key={e.key}
            name={e.name}
            className={classNames(entryClasses)}
            body={e.body}
            maySpawn={e.maySpawn}
          />
        );
      case "spawn": {
        const { src } = e.body;
        return (
          <div key={e.key} className={classNames(entryClasses, styles.media)}>
            <a href={src} target="_blank" rel="noopener noreferrer">
              <img src={src} />
            </a>
            <div className={styles.mediaBody}>
              <span>
                <b>{e.name}</b>
              </span>
              <span>
                {"took a "}
                <b>
                  <a href={src} target="_blank" rel="noopener noreferrer">
                    photo
                  </a>
                </b>.
              </span>
            </div>
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
