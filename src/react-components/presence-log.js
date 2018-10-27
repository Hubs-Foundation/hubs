import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "../assets/stylesheets/presence-log.scss";
import classNames from "classnames";
import Linkify from "react-linkify";
import { toArray as toEmojis } from "react-emoji-render";
import { FormattedMessage } from "react-intl";
import serializeElement from "../utils/serialize-element";

const messageCanvas = document.createElement("canvas");
const presenceLogSpawnedStyle = `background-color: rgba(79, 79, 79, 0.45); padding: 8px 16px; border-radius: 16px; text-align: center;`;
const presenceLogPureEmojiStyle = `background-color: transparent; text-align: center;`;
const emojiRegex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/;

function ChatMessage(props) {
  const ref = React.createRef();

  const handleSpawn = () => {
    const el = ref.current;

    const context = messageCanvas.getContext("2d");
    const emoji = toEmojis(props.body);
    const isEmoji =
      emoji.length === 1 &&
      emoji[0].props &&
      emoji[0].props.children.match &&
      emoji[0].props.children.match(emojiRegex);

    const style = isEmoji ? presenceLogPureEmojiStyle : presenceLogSpawnedStyle;

    // Scale by 12x
    messageCanvas.width = (el.offsetWidth + 33) * 12;
    messageCanvas.height = (el.offsetHeight + 17) * 12;

    const xhtml = encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="${messageCanvas.width}" height="${messageCanvas.height}">
        <foreignObject width="8.33%" height="8.33%" style="transform: scale(12.0);">
          <div xmlns="http://www.w3.org/1999/xhtml" style="${style}">
            ${serializeElement(el)}
          </div>
        </foreignObject>
      </svg>
`);
    const img = new Image();

    img.onload = async () => {
      context.drawImage(img, 0, 0);
      const blob = await new Promise(resolve => messageCanvas.toBlob(resolve));
      document.querySelector("a-scene").emit("add_media", new File([blob], "message.png", { type: "image/png" }));
    };

    img.src = "data:image/svg+xml," + xhtml;
  };

  return (
    <div className={props.className}>
      {props.maySpawn && <button className={styles.spawnMessage} onClick={handleSpawn} />}
      <b>{props.name}</b>:
      <span className={styles.messageBody} ref={ref}>
        <Linkify properties={{ target: "_blank", rel: "noopener referrer" }}>{toEmojis(props.body)}</Linkify>
      </span>
    </div>
  );
}

ChatMessage.propTypes = {
  name: PropTypes.string,
  maySpawn: PropTypes.bool,
  body: PropTypes.string,
  className: PropTypes.string
};

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
            <b>{e.oldName}</b> <FormattedMessage id="presence.name_change" />&nbsp;<b>{e.newName}</b>.
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
