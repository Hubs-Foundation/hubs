import React from "react";
import PropTypes from "prop-types";
import styles from "./RoomSidebar.scss";
import { Sidebar } from "../sidebar/Sidebar";
import { CloseButton } from "../input/CloseButton";
import { InputField } from "../input/InputField";
import { IconButton } from "../input/IconButton";
import { Button } from "../input/Button";
import { Column } from "../layout/Column";
import { FormattedMessage } from "react-intl";

function SceneAttribution({ attribution }) {
  if (attribution.url) {
    const source = attribution.url.includes("sketchfab.com")
      ? "on Sketchfab"
      : attribution.url.includes("poly.google.com")
        ? "on Google Poly"
        : null;

    return (
      <li className={styles.attribution}>
        <div className={styles.attributionName}>
          <a href={attribution.url} target="_blank" rel="noopener noreferrer">
            {attribution.name}
          </a>
        </div>
        <div className={styles.attributionAuthor}>
          {source ? (
            <FormattedMessage
              id="room-sidebar.scene-attribution-with-source"
              defaultMessage="by {author} on {source}"
              values={{
                author: attribution.author,
                source
              }}
            />
          ) : (
            <FormattedMessage
              id="room-sidebar.scene-attribution"
              defaultMessage="by {author}"
              values={{
                author: attribution.author
              }}
            />
          )}
        </div>
      </li>
    );
  } else {
    return (
      <li className={styles.attribution}>
        <div className={styles.attributionName}>{attribution.name}</div>
        <div className={styles.attributionAuthor}>
          <FormattedMessage
            id="room-sidebar.scene-attribution"
            defaultMessage="by {author}"
            values={{
              author: attribution.author
            }}
          />
        </div>
      </li>
    );
  }
}

// To assist with content control, we avoid displaying scene links to users who are not the scene
// creator, unless the scene is remixable or promotable.
function allowDisplayOfSceneLink(accountId, scene) {
  return (accountId && scene.account_id === accountId) || scene.allow_promotion || scene.allow_remixing;
}

export function SceneInfo({ accountId, scene, showAttributions, canChangeScene, onChangeScene }) {
  const showSceneLink = allowDisplayOfSceneLink(accountId, scene);
  const attributions = (scene.attributions && scene.attributions.content) || [];
  const creator = scene.attributions && scene.attributions.creator;

  return (
    <>
      <h2 className={styles.sectionTitle}>
        <FormattedMessage id="room-sidebar.scene-info.title" defaultMessage="Scene" />
      </h2>
      <div className={styles.sceneScreenshotContainer}>
        {showSceneLink ? (
          <a href={scene.url} target="_blank" rel="noopener noreferrer">
            <img className={styles.sceneScreenshotImage} src={scene.screenshot_url} />
          </a>
        ) : (
          <img className={styles.sceneScreenshotImage} src={scene.screenshot_url} />
        )}
      </div>
      <div className={styles.sceneInfo}>
        {showSceneLink ? (
          <b className={styles.sceneName}>
            <a href={scene.url} target="_blank" rel="noopener noreferrer">
              {scene.name}
            </a>
          </b>
        ) : (
          <b className={styles.sceneName}>{scene.name}</b>
        )}
        <div className={styles.sceneCreator}>
          <FormattedMessage
            id="room-sidebar.scene-info.scene-creator"
            defaultMessage="by {creator}"
            values={{ creator }}
          />
        </div>
      </div>
      {showAttributions && (
        <InputField
          label={<FormattedMessage id="room-sidebar.scene-info.attributions" defaultMessage="Attributions" />}
        >
          <ul className={styles.attributions}>
            {attributions.map((attribution, i) => <SceneAttribution attribution={attribution} key={i} />)}
          </ul>
        </InputField>
      )}
      {canChangeScene && (
        <Button preset="blue" onClick={onChangeScene}>
          <FormattedMessage id="room-sidebar.scene-info.change-scene-button" defaultMessage="Change Scene" />
        </Button>
      )}
    </>
  );
}

export function RoomSidebar({ room, accountId, onClose, canEdit, onEdit, onChangeScene }) {
  return (
    <Sidebar
      title={<FormattedMessage id="room-sidebar.title" defaultMessage="Room" />}
      beforeTitle={<CloseButton onClick={onClose} />}
      afterTitle={
        canEdit && (
          <IconButton onClick={onEdit}>
            <FormattedMessage id="room-sidebar.edit-button" defaultMessage="Edit" />
          </IconButton>
        )
      }
    >
      <Column padding>
        <InputField label={<FormattedMessage id="room-sidebar.room-name" defaultMessage="Name" />}>
          {room.name}
        </InputField>
        {room.description && (
          <InputField label={<FormattedMessage id="room-sidebar.room-description" defaultMessage="Description" />}>
            {room.description}
          </InputField>
        )}
        {room.scene && (
          <SceneInfo
            accountId={accountId}
            scene={room.scene}
            showAttributions
            canChangeScene={canEdit}
            onChangeScene={onChangeScene}
          />
        )}
      </Column>
    </Sidebar>
  );
}

RoomSidebar.propTypes = {
  accountId: PropTypes.string,
  room: PropTypes.object.isRequired,
  onClose: PropTypes.func,
  canEdit: PropTypes.bool,
  onEdit: PropTypes.func,
  onChangeScene: PropTypes.func
};
