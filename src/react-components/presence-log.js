import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "../assets/stylesheets/presence-log.scss";
import classNames from "classnames";
import { FormattedMessage } from "react-intl";
import ChatMessage from "./chat-message";
import { share } from "../utils/share";

function SpawnPhotoMessage({ name, body: { src: url }, className, maySpawn, hubId }) {
  let landingPageUrl = new URL(url);
  const [hostname, port] = process.env.RETICULUM_SERVER.split(":");
  console.log(hostname, port, landingPageUrl.port);
  landingPageUrl.hostname = hostname;
  if (port) landingPageUrl.port = port;
  landingPageUrl.pathname = landingPageUrl.pathname.replace(".png", ".html");
  landingPageUrl = landingPageUrl.toString();

  const onShareClicked = share.bind(null, {
    url: landingPageUrl,
    title: `Taken in #hubs, join me at https://hub.link/${hubId}`
  });
  return (
    <div className={className}>
      {maySpawn && <button className={classNames(styles.iconButton, styles.share)} onClick={onShareClicked} />}
      <div className={styles.mediaBody}>
        <span>
          <b>{name}</b>
        </span>
        <span>
          {"took a "}
          <b>
            <a href={landingPageUrl} target="_blank" rel="noopener noreferrer">
              photo
            </a>
          </b>.
        </span>
      </div>
      <a href={landingPageUrl} target="_blank" rel="noopener noreferrer">
        <img src={url} />
      </a>
    </div>
  );
}
SpawnPhotoMessage.propTypes = {
  name: PropTypes.string,
  maySpawn: PropTypes.bool,
  body: PropTypes.object,
  className: PropTypes.string,
  hubId: PropTypes.string
};

function ChatBody(props) {
  return <div>{...props.children}</div>;
}

ChatBody.propTypes = {
  children: PropTypes.array
};

export default class PresenceLog extends Component {
  static propTypes = {
    entries: PropTypes.array,
    inRoom: PropTypes.bool,
    hubId: PropTypes.string
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
        return (
          <SpawnPhotoMessage
            key={e.key}
            name={e.name}
            className={classNames(entryClasses, styles.media)}
            body={e.body}
            maySpawn={e.maySpawn}
            hubId={this.props.hubId}
          />
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
