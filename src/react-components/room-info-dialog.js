import React, { Component } from "react";
import PropTypes from "prop-types";
import { injectIntl, FormattedMessage } from "react-intl";

import DialogContainer from "./dialog-container.js";
import styles from "../assets/stylesheets/room-info-dialog.scss";
import { scaledThumbnailUrlFor } from "../utils/media-url-utils";
import { allowDisplayOfSceneLink } from "../utils/scene-url-utils";

class RoomInfoDialog extends Component {
  static propTypes = {
    hubName: PropTypes.string,
    hubDescription: PropTypes.string,
    scene: PropTypes.object,
    store: PropTypes.object
  };

  render() {
    const hasDescription = !!this.props.hubDescription;
    const hasScene = !!this.props.scene;

    const showSceneLink = hasScene && allowDisplayOfSceneLink(this.props.scene, this.props.store);

    const toAttributionDiv = (a, i) => {
      if (a.url) {
        const source = a.url.includes("sketchfab.com")
          ? "on Sketchfab"
          : a.url.includes("poly.google.com")
            ? "on Google Poly"
            : "";

        return (
          <div className={styles.attribution} key={`${a.url} ${i}`}>
            <div className={styles.attributionName}>
              <a href={a.url} target="_blank" rel="noopener noreferrer">
                {a.name}
              </a>
            </div>
            <div className={styles.attributionAuthor}>
              by {a.author} {source}
            </div>
          </div>
        );
      } else {
        return (
          <div className={styles.attribution} key={`${a.name} ${a.author} {i}`}>
            <div className={styles.attributionName}>{a.name}</div>
            <div className={styles.attributionAuthor}>by {a.author}</div>
          </div>
        );
      }
    };

    let attributions = null;
    let creator = null;

    if (hasScene && this.props.scene.attributions) {
      creator = this.props.scene.attributions.creator;
      attributions = (
        <div>
          {this.props.scene.attributions.content && this.props.scene.attributions.content.map(toAttributionDiv)}
        </div>
      );
    }

    const title = (
      <div className={styles.title}>
        {hasDescription && hasScene ? <FormattedMessage id="room-info.title" /> : this.props.hubName}
      </div>
    );

    return (
      <DialogContainer title={title} wide={true} {...this.props}>
        {hasDescription && (
          <>
            {hasScene && <div className={styles.hubTitle}>{this.props.hubName}</div>}
            <div className={styles.description}>{this.props.hubDescription}</div>
          </>
        )}
        {hasScene && (
          <>
            <div className={styles.subtitle}>
              <FormattedMessage id="room-info.scene-info" />
            </div>
            <div className={styles.roomInfo}>
              <div className={styles.sceneScreenshot}>
                {showSceneLink ? (
                  <a href={this.props.scene.url} target="_blank" rel="noopener noreferrer">
                    <img src={scaledThumbnailUrlFor(this.props.scene.screenshot_url, 400, 480)} />
                  </a>
                ) : (
                  <img src={scaledThumbnailUrlFor(this.props.scene.screenshot_url, 400, 480)} />
                )}
              </div>
              <div className={styles.sceneDetails}>
                <div className={styles.sceneMain}>
                  <div className={styles.sceneName}>
                    {showSceneLink ? (
                      <a href={this.props.scene.url} target="_blank" rel="noopener noreferrer">
                        {this.props.scene.name}
                      </a>
                    ) : (
                      <span>{this.props.scene.name}</span>
                    )}
                  </div>
                  <div className={styles.sceneCreator}>{creator}</div>
                </div>
                <div className={styles.sceneAttributions}>{attributions}</div>
                <div className={styles.sceneButtons}> </div>
              </div>
            </div>
          </>
        )}
      </DialogContainer>
    );
  }
}
export default injectIntl(RoomInfoDialog);
