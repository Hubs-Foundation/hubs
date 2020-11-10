import React from "react";
import PropTypes from "prop-types";
import styles from "./RoomSidebar.scss";
import { Sidebar } from "../sidebar/Sidebar";
import { CloseButton } from "../input/CloseButton";
import { InputField } from "../input/InputField";
import { IconButton } from "../input/IconButton";

function SceneAttribution({ attribution }) {
  if (attribution.url) {
    const source = attribution.url.includes("sketchfab.com")
      ? "on Sketchfab"
      : attribution.url.includes("poly.google.com")
        ? "on Google Poly"
        : "";

    return (
      <li className={styles.attribution}>
        <div className={styles.attributionName}>
          <a href={attribution.url} target="_blank" rel="noopener noreferrer">
            {attribution.name}
          </a>
        </div>
        <div className={styles.attributionAuthor}>
          by {attribution.author} {source}
        </div>
      </li>
    );
  } else {
    return (
      <li className={styles.attribution}>
        <div className={styles.attributionName}>{attribution.name}</div>
        <div className={styles.attributionAuthor}>by {attribution.author}</div>
      </li>
    );
  }
}

// To assist with content control, we avoid displaying scene links to users who are not the scene
// creator, unless the scene is remixable or promotable.
function allowDisplayOfSceneLink(accountId, scene) {
  return (accountId && scene.account_id === accountId) || scene.allow_promotion || scene.allow_remixing;
}

export function RoomSidebar({ room, accountId, onClose, canEdit, onEdit }) {
  const showSceneLink = room.scene && allowDisplayOfSceneLink(accountId, room.scene);
  const attributions = (room.scene && room.scene.attributions && room.scene.attributions.content) || [];
  const creator = room.scene && room.scene.attributions && room.scene.attributions.creator;

  return (
    <Sidebar
      title="Room"
      beforeTitle={<CloseButton onClick={onClose} />}
      afterTitle={canEdit && <IconButton onClick={onEdit}>Edit</IconButton>}
    >
      <div className={styles.roomInfoDialog}>
        <InputField label="Name">{room.name}</InputField>
        {room.description && <InputField label="Description">{room.description}</InputField>}
        {room.scene && (
          <>
            <h2 className={styles.sectionTitle}>Scene</h2>
            <div className={styles.sceneScreenshotContainer}>
              {showSceneLink ? (
                <a href={room.scene.url} target="_blank" rel="noopener noreferrer">
                  <img className={styles.sceneScreenshotImage} src={room.scene.screenshot_url} />
                </a>
              ) : (
                <img className={styles.sceneScreenshotImage} src={room.scene.screenshot_url} />
              )}
            </div>
            <div className={styles.sceneInfo}>
              {showSceneLink ? (
                <b className={styles.sceneName}>
                  <a href={room.scene.url} target="_blank" rel="noopener noreferrer">
                    {room.scene.name}
                  </a>
                </b>
              ) : (
                <b className={styles.sceneName}>{room.scene.name}</b>
              )}
              <div className={styles.sceneCreator}>by {creator}</div>
            </div>
            <InputField label="Attributions">
              <ul className={styles.attributions}>
                {attributions.map((attribution, i) => <SceneAttribution attribution={attribution} key={i} />)}
              </ul>
            </InputField>
          </>
        )}
      </div>
    </Sidebar>
  );
}

RoomSidebar.propTypes = {
  accountId: PropTypes.string,
  room: PropTypes.object.isRequired,
  onClose: PropTypes.func,
  canEdit: PropTypes.bool,
  onEdit: PropTypes.func
};
