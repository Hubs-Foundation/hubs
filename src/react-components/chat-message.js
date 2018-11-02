import React from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import styles from "../assets/stylesheets/presence-log.scss";
import classNames from "classnames";
import Linkify from "react-linkify";
import { toArray as toEmojis } from "react-emoji-render";
import serializeElement from "../utils/serialize-element";

const messageCanvas = document.createElement("canvas");
const emojiRegex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/;
const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)$/;

const messageBodyDom = body => {
  // Support wrapping text in ` to get monospace, and multiline.
  const multiLine = body.split("\n").length > 1;
  const mono = body.startsWith("`") && body.endsWith("`");
  const messageBodyClasses = {
    [styles.messageBody]: true,
    [styles.messageBodyMulti]: multiLine,
    [styles.messageBodyMono]: mono
  };

  const cleanedBody = (mono ? body.substring(1, body.length - 1) : body).trim();

  return (
    <div className={classNames(messageBodyClasses)}>
      <Linkify properties={{ target: "_blank", rel: "noopener referrer" }}>{toEmojis(cleanedBody)}</Linkify>
    </div>
  );
};

export function spawnChatMessage(body) {
  if (body.length === 0) return;

  if (body.match(urlRegex)) {
    document.querySelector("a-scene").emit("add_media", body);
    return;
  }

  const isOneLine = body.split("\n").length === 1;
  const context = messageCanvas.getContext("2d");
  const emoji = toEmojis(body);
  const isEmoji =
    emoji.length === 1 && emoji[0].props && emoji[0].props.children.match && emoji[0].props.children.match(emojiRegex);

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
      {messageBodyDom(body)}
    </div>
  );

  ReactDOM.render(entryDom, el, () => {
    // Scale by 12x
    messageCanvas.width = el.offsetWidth * 12.1;
    messageCanvas.height = el.offsetHeight * 12.1;

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
}

export default function ChatMessage(props) {
  const isOneLine = props.body.split("\n").length === 1;

  return (
    <div className={props.className}>
      {props.maySpawn && <button className={styles.spawnMessage} onClick={() => spawnChatMessage(props.body)} />}
      <div className={isOneLine ? styles.messageWrap : styles.messageWrapMulti}>
        <div className={styles.messageSource}>
          <b>{props.name}</b>:
        </div>
        {messageBodyDom(props.body)}
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
