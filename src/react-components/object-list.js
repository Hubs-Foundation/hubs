import React, { Component } from "react";
import { FormattedMessage } from "react-intl";
import PropTypes from "prop-types";
import classNames from "classnames";
import rootStyles from "../assets/stylesheets/ui-root.scss";
import objectListStyles from "../assets/stylesheets/object-list-styles.scss";
import styles from "../assets/stylesheets/presence-list.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCubes } from "@fortawesome/free-solid-svg-icons/faCubes";
import {
  SORT_ORDER_VIDEO,
  SORT_ORDER_AUDIO,
  SORT_ORDER_IMAGE,
  SORT_ORDER_PDF,
  SORT_ORDER_MODEL,
  SORT_ORDER_UNIDENTIFIED,
  mediaSortOrder,
  mediaSort,
  DISPLAY_IMAGE
} from "../utils/media-sorting.js";

const THUMBNAIL_TITLE = new Map([
  [SORT_ORDER_VIDEO, "Video"],
  [SORT_ORDER_AUDIO, "Audio"],
  [SORT_ORDER_IMAGE, "Image"],
  [SORT_ORDER_PDF, "PDF"],
  [SORT_ORDER_UNIDENTIFIED, "Unknown Media Type"],
  [SORT_ORDER_MODEL, "Model"]
]);

function getDisplayString(el) {
  // Having a listed-media component does not guarantee the existence of a media-loader component,
  // so don't crash if there isn't one.
  const url = (el.components["media-loader"] && el.components["media-loader"].data.src) || "";
  const split = url.split("/");
  const resourceName = split[split.length - 1].split("?")[0];
  let httpIndex = -1;
  for (let i = 0; i < split.length; i++) {
    if (split[i].indexOf("http") !== -1) {
      httpIndex = i;
    }
  }

  let host = "";
  let lessHost = "";
  if (httpIndex !== -1 && split.length > httpIndex + 3) {
    host = split[httpIndex + 2];
    const hostSplit = host.split(".");
    if (hostSplit.length > 1) {
      lessHost = `${hostSplit[hostSplit.length - 2]}.${hostSplit[hostSplit.length - 1]}`;
    }
  }

  const firstPart =
    url.indexOf("poly.google") !== -1
      ? "Google Poly"
      : url.indexOf("sketchfab.com") !== -1
        ? "Sketchfab"
        : url.indexOf("youtube.com") !== -1
          ? "YouTube"
          : lessHost;

  return `${firstPart} ... ${resourceName.substr(0, 4)}`;
}

export default class ObjectList extends Component {
  static propTypes = {
    onInspectObject: PropTypes.func,
    onExpand: PropTypes.func,
    scene: PropTypes.object,
    expanded: PropTypes.bool
  };

  state = {
    inspecting: false,
    mediaEntities: []
  };

  unexpand() {
    if (this.props.expanded) {
      this.props.onExpand(false, true);
    }
  }

  componentDidMount() {
    this.unexpand = this.unexpand.bind(this);
    document.querySelector(".a-canvas").addEventListener("mousedown", this.unexpand);
    this.updateMediaEntities = this.updateMediaEntities.bind(this);
    this.updateMediaEntities();
    this.props.scene.addEventListener("listed_media_changed", () => setTimeout(() => this.updateMediaEntities(), 0));
    // HACK: The listed-media component exists before the media-loader component does, in cases where an entity is created from a network template because of an incoming message, so don't updateMediaEntities right away.
    // Sorry in advance for the day this comment is out of date.
  }
  componentWillUnmount() {
    const canvas = document.querySelector(".a-canvas");
    if (canvas) {
      canvas.removeEventListener("mousedown", this.unexpand);
    }
  }

  updateMediaEntities() {
    const mediaEntities = [...this.props.scene.systems["listed-media"].els];
    mediaEntities.sort(mediaSort);
    this.setState({ mediaEntities });
  }

  componentDidUpdate() {}

  domForEntity(el, i) {
    return (
      <button
        aria-label="Show Object Info Panel"
        key={i}
        className={objectListStyles.rowNoMargin}
        onMouseDown={() => {
          this.props.onExpand(false, false);
          this.props.onInspectObject(el);
        }}
        onMouseOut={() => {
          if (this.props.expanded && !AFRAME.utils.device.isMobileVR()) {
            AFRAME.scenes[0].systems["hubs-systems"].cameraSystem.uninspect();
          }
        }}
        onMouseOver={() => {
          AFRAME.scenes[0].systems["hubs-systems"].cameraSystem.uninspect();
          AFRAME.scenes[0].systems["hubs-systems"].cameraSystem.inspect(el.object3D, el.object3D, 1.5, true);
        }}
      >
        <div title={THUMBNAIL_TITLE.get(mediaSortOrder(el))} className={objectListStyles.icon}>
          <FontAwesomeIcon icon={DISPLAY_IMAGE.get(mediaSortOrder(el))} />
        </div>
        <div className={classNames({ [styles.listItem]: true })}>
          <div className={styles.presence}>
            <p>{getDisplayString(el)}</p>
          </div>
        </div>
      </button>
    );
  }

  renderExpandedList() {
    return (
      <div className={rootStyles.objectList}>
        <div className={objectListStyles.contents}>
          <div className={styles.rows}>
            {this.state.mediaEntities.length ? (
              this.state.mediaEntities.map(this.domForEntity.bind(this))
            ) : (
              <FormattedMessage id="object-info.no-media" className={styles.listItem} />
            )}
          </div>
        </div>
      </div>
    );
  }

  render() {
    const numObjects = (this.state.mediaEntities && this.state.mediaEntities.length) || 0;
    return (
      <div>
        <button
          title="Media"
          aria-label={`Toggle list of ${numObjects} object${numObjects === 1 ? "" : "s"}`}
          onClick={() => {
            this.props.onExpand(!this.props.expanded, !AFRAME.utils.device.isMobileVR());
          }}
          className={classNames({
            [rootStyles.objectListButton]: true,
            [rootStyles.presenceInfoSelected]: this.props.expanded
          })}
        >
          <FontAwesomeIcon icon={faCubes} />
          <span className={rootStyles.mediaCount}>{this.state.mediaEntities.length}</span>
        </button>
        {this.props.expanded && this.renderExpandedList()}
      </div>
    );
  }
}
