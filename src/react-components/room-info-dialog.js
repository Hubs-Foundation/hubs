import React from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import styles from "./room/RoomInfoDialog.scss";
import { scaledThumbnailUrlFor } from "../utils/media-url-utils";
import { allowDisplayOfSceneLink } from "../utils/scene-url-utils";
import { Sidebar, CloseButton } from "./sidebar/Sidebar";
import { InputField } from "./input/InputField";

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

// TODO: Move to /room folder
export function RoomInfoDialog({ scene, store, hubName, hubDescription, onClose }) {
  const hasScene = !!scene;
  const showSceneLink = hasScene && allowDisplayOfSceneLink(scene, store);
  const attributions = (scene && scene.attributions && scene.attributions.content) || [];
  const creator = scene && scene.attributions && scene.attributions.creator;

  return (
    <Sidebar title={<FormattedMessage id="room-info.title" />} beforeTitle={<CloseButton onClick={onClose} />}>
      <div className={styles.roomInfoDialog}>
        <h2 className={styles.sectionTitle}>Room</h2>
        {hubName && <InputField label="Name">{hubName}</InputField>}
        {hubDescription && <InputField label="Description">{hubDescription}</InputField>}
        {hasScene && (
          <>
            <h2 className={styles.sectionTitle}>Scene</h2>
            <div className={styles.sceneScreenshot}>
              {showSceneLink ? (
                <a href={scene.url} target="_blank" rel="noopener noreferrer">
                  <img src={scaledThumbnailUrlFor(scene.screenshot_url, 400, 480)} />
                </a>
              ) : (
                <img src={scaledThumbnailUrlFor(scene.screenshot_url, 400, 480)} />
              )}
            </div>
            <div className={styles.sceneInfo}>
              {showSceneLink ? (
                <h1 className={styles.sceneName}>
                  <a href={scene.url} target="_blank" rel="noopener noreferrer">
                    {scene.name}
                  </a>
                </h1>
              ) : (
                <h1 className={styles.sceneName}>{scene.name}</h1>
              )}
              <div className={styles.sceneCreator}>{creator}</div>
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

RoomInfoDialog.propTypes = {
  hubName: PropTypes.string,
  hubDescription: PropTypes.string,
  scene: PropTypes.object,
  store: PropTypes.object,
  onClose: PropTypes.func
};
