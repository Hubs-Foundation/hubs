import React, { Component } from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import styles from "../assets/stylesheets/presence-log.scss";
import classNames from "classnames";
import Linkify from "react-linkify";
import { toArray as toEmojis } from "react-emoji-render";
import { FormattedMessage } from "react-intl";
import serializeElement from "../utils/serialize-element";

const messageCanvas = document.createElement("canvas");
const presenceLogSpawnedStyle = `background-color: white; color: black; padding: 8px 16px; border-radius: 16px;`;
const presenceLogPureEmojiStyle = `background-color: transparent; text-align: center;`;
const emojiRegex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/;
const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)$/;

function ChatMessage(props) {
  const handleSpawn = domToRender => {
    if (props.body.match(urlRegex)) {
      document.querySelector("a-scene").emit("add_media", props.body);
      return;
    }

    const context = messageCanvas.getContext("2d");
    const emoji = toEmojis(props.body);
    const isEmoji =
      emoji.length === 1 &&
      emoji[0].props &&
      emoji[0].props.children.match &&
      emoji[0].props.children.match(emojiRegex);

    const isOneLine = props.body.split("\n").length === 1;

    const el = document.createElement("div");
    el.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
    el.setAttribute("class", `${styles.presenceLog} ${styles.presenceLogSpawn}`);

    // The element is added to the DOM in order to have layout compute the width & height,
    // and then it is removed after being rendered.
    document.body.appendChild(el);

    const entryDom = (
      <div
        className={classNames({
          [styles.presenceLogEntry]: !isEmoji,
          [styles.presenceLogEntryOneLine]: !isEmoji && isOneLine,
          [styles.presenceLogEmoji]: isEmoji
        })}
      >
        {domToRender}
      </div>
    );

    ReactDOM.render(entryDom, el, () => {
      // Scale by 12x
      messageCanvas.width = el.offsetWidth * 12;
      messageCanvas.height = el.offsetHeight * 12;

      const xhtml = encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="${messageCanvas.width}" height="${messageCanvas.height}">
          <foreignObject width="8.333%" height="8.333%" style="transform: scale(12.0);">
            ${serializeElement(el)}
          </foreignObject>
        </svg>
  `);
      const img = new Image();

      img.onload = async () => {
        context.drawImage(img, 0, 0);
        const blob = await new Promise(resolve => messageCanvas.toBlob(resolve));
        document.querySelector("a-scene").emit("add_media", new File([blob], "message.png", { type: "image/png" }));
        el.parentNode.removeChild(el);
      };

      img.src = "data:image/svg+xml," + xhtml;
    });
  };

  // Support wrapping text in ` to get monospace, and multiline.
  const multiLine = props.body.split("\n").length > 1;
  const mono = props.body.startsWith("`") && props.body.endsWith("`");
  const messageBodyClasses = {
    [styles.messageBody]: true,
    [styles.messageBodyMulti]: multiLine,
    [styles.messageBodyMono]: mono
  };
  const body = (mono ? props.body.substring(1, props.body.length - 1) : props.body).trim();

  const spawnableDom = (
    <div className={classNames(messageBodyClasses)}>
      <Linkify properties={{ target: "_blank", rel: "noopener referrer" }}>{toEmojis(body)}</Linkify>
    </div>
  );

  return (
    <div className={props.className}>
      {props.maySpawn && <button className={styles.spawnMessage} onClick={() => handleSpawn(spawnableDom)} />}
      <div className={multiLine ? styles.messageWrapMulti : styles.messageWrap}>
        <div className={styles.messageSource}>
          <b>{props.name}</b>:
        </div>
        {spawnableDom}
      </div>
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
