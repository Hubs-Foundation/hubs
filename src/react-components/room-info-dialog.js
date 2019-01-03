import React, { Component } from "react";
import PropTypes from "prop-types";
import DialogContainer from "./dialog-container.js";
import styles from "../assets/stylesheets/room-info-dialog.scss";
import { scaledThumbnailUrlFor } from "../utils/media-utils";

export default class RoomInfoDialog extends Component {
  static propTypes = {
    hubName: PropTypes.string,
    scene: PropTypes.object
  };

  render() {
    const toAttributionDiv = a => {
      if (a.url) {
        const source =
          a.url.indexOf("sketchfab.com") >= 0
            ? "on Sketchfab"
            : a.url.indexOf("poly.google.com") >= 0
              ? "on Google Poly"
              : "";

        return (
          <div key={a.url}>
            <div>
              <a href={a.url} target="_blank" rel="noopener noreferrer">
                {a.name}
              </a>
            </div>
            <div>
              by {a.author} {source}
            </div>
          </div>
        );
      } else {
        return (
          <div key={`${a.name} ${a.author}`}>
            <div>{a.name}</div>
            <div>by {a.author}</div>
          </div>
        );
      }
    };

    console.log(this.props.scene);
    let attributions = null;
    let creator = null;

    if (this.props.scene.attributions) {
      creator = this.props.scene.attributions.creator;
      attributions = (
        <div>
          {this.props.scene.attributions.content && this.props.scene.attributions.content.map(toAttributionDiv)}
        </div>
      );
    }

    const title = <div>{this.props.hubName}</div>;

    return (
      <DialogContainer title={title} {...this.props}>
        <div className={styles.roomInfo}>
          <div className={styles.sceneScreenshot}>
            <img src={scaledThumbnailUrlFor(this.props.scene.screenshot_url, 400, 480)} />
          </div>
          <div className={styles.sceneDetails}>
            <div className={styles.sceneMain}>
              <div className={styles.sceneName}>{this.props.scene.name}</div>
              <div className={styles.sceneCreator}>{creator}</div>
            </div>
            <div className={styles.sceneAttributions}>{attributions}</div>
            <div className={styles.sceneButtons}> </div>
          </div>
        </div>
      </DialogContainer>
    );
  }
}
