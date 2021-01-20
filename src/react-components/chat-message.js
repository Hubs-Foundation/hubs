import React from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import styles from "../assets/stylesheets/presence-log.scss";
import classNames from "classnames";
import { toArray as toEmojis } from "react-emoji-render";
import html2canvas from "html2canvas";
import { coerceToUrl } from "../utils/media-utils";
import { formatMessageBody } from "../utils/chat-message";

const emojiRegex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/;
const textureLoader = new THREE.TextureLoader();

const CHAT_MESSAGE_TEXTURE_SIZE = 1024;

const messageBodyDom = (body, from, fromSessionId, onViewProfile) => {
  const { formattedBody, multiline, monospace } = formatMessageBody(body);
  const wrapStyle = multiline ? styles.messageWrapMulti : styles.messageWrap;
  const messageBodyClasses = {
    [styles.messageBody]: true,
    [styles.messageBodyMulti]: multiline,
    [styles.messageBodyMono]: monospace
  };
  const includeClientLink = onViewProfile && fromSessionId && history && NAF.clientId !== fromSessionId;
  const onFromClick = includeClientLink ? () => onViewProfile(fromSessionId) : () => {};

  return (
    <div className={wrapStyle}>
      {from && (
        <div
          onClick={onFromClick}
          className={classNames({ [styles.messageSource]: true, [styles.messageSourceLink]: includeClientLink })}
        >
          {from}:
        </div>
      )}
      <div className={classNames(messageBodyClasses)}>{formattedBody}</div>
    </div>
  );
};

function renderChatMessage(body, from, allowEmojiRender) {
  const isOneLine = body.split("\n").length === 1;
  const emoji = toEmojis(body);
  const isEmoji =
    allowEmojiRender &&
    emoji.length === 1 &&
    emoji[0].props &&
    emoji[0].props.children.match &&
    emoji[0].props.children.match(emojiRegex);

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
      {messageBodyDom(body, from)}
    </div>
  );

  return new Promise((resolve, reject) => {
    ReactDOM.render(entryDom, el, () => {
      const width = el.offsetWidth;
      const height = el.offsetHeight;
      const ratio = height / width;
      const scale = (CHAT_MESSAGE_TEXTURE_SIZE * Math.min(1.0, 1.0 / ratio)) / el.offsetWidth;
      html2canvas(el, { backgroundColor: null, scale, logging: false })
        .then(canvas => {
          canvas.toBlob(blob => resolve([blob, width, height]), "image/png");
        })
        .catch(reject);
    });
  });
}

export async function createInWorldLogMessage({ name, type, body }) {
  if (type !== "chat") return;

  const [blob, width, height] = await renderChatMessage(body, name, false);
  const entity = document.createElement("a-entity");
  const meshEntity = document.createElement("a-entity");

  document.querySelector("a-scene").appendChild(entity);

  entity.appendChild(meshEntity);
  entity.setAttribute("class", "ui");
  entity.setAttribute("is-remote-hover-target", {});
  entity.setAttribute("follow-in-fov", {
    target: "#avatar-pov-node",
    offset: { x: 0, y: 0.0, z: -0.8 }
  });

  const blobUrl = URL.createObjectURL(blob);

  meshEntity.setAttribute("animation__float", {
    property: "position",
    dur: 10000,
    from: { x: 0, y: 0, z: 0 },
    to: { x: 0, y: 0.05, z: -0.05 },
    easing: "easeOutQuad"
  });

  entity.setAttribute("animation__spawn", {
    property: "scale",
    dur: 200,
    from: { x: 0.1, y: 0.1, z: 0.1 },
    to: { x: 1, y: 1, z: 1 },
    easing: "easeOutElastic"
  });

  meshEntity.setAttribute("animation__opacity", {
    property: "meshMaterial.opacity",
    isRawProperty: true,
    delay: 3000,
    dur: 8000,
    from: 1.0,
    to: 0.0,
    easing: "easeInQuad"
  });

  meshEntity.addEventListener("animationcomplete__opacity", () => {
    entity.parentNode.removeChild(entity);
  });

  textureLoader.load(blobUrl, texture => {
    const material = new THREE.MeshBasicMaterial();
    material.transparent = true;
    material.map = texture;
    material.generateMipmaps = false;
    material.needsUpdate = true;

    const geometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1, texture.flipY);
    const mesh = new THREE.Mesh(geometry, material);
    meshEntity.setObject3D("mesh", mesh);
    meshEntity.meshMaterial = material;
    const scaleFactor = 400;
    meshEntity.object3DMap.mesh.scale.set(width / scaleFactor, height / scaleFactor, 1);
  });
}

export async function spawnChatMessage(body, from) {
  if (body.length === 0) return;

  try {
    const url = new URL(coerceToUrl(body));
    if (url.host) {
      document.querySelector("a-scene").emit("add_media", body);
      return;
    }
  } catch (e) {
    // Ignore parse error
  }

  // If not a URL, spawn as a text bubble

  const [blob] = await renderChatMessage(body, from, true);
  document.querySelector("a-scene").emit("add_media", new File([blob], "message.png", { type: "image/png" }));
}

export default function ChatMessage(props) {
  return (
    <div className={props.className}>
      {props.maySpawn && (
        <button
          className={classNames(styles.iconButton, styles.spawnMessage)}
          onClick={() => spawnChatMessage(props.body)}
        />
      )}
      {messageBodyDom(props.body, props.name, props.sessionId, props.onViewProfile)}
    </div>
  );
}

ChatMessage.propTypes = {
  name: PropTypes.string,
  maySpawn: PropTypes.bool,
  body: PropTypes.string,
  sessionId: PropTypes.string,
  className: PropTypes.string,
  onViewProfile: PropTypes.func
};
