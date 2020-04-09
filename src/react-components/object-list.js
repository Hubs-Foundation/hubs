import React, { Component } from "react";
import { FormattedMessage } from "react-intl";
import PropTypes from "prop-types";
import classNames from "classnames";
import rootStyles from "../assets/stylesheets/ui-root.scss";
import styles from "../assets/stylesheets/presence-list.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCubes } from "@fortawesome/free-solid-svg-icons/faCubes";
import { faCube } from "@fortawesome/free-solid-svg-icons/faCube";
import { faVideo } from "@fortawesome/free-solid-svg-icons/faVideo";
import { faMusic } from "@fortawesome/free-solid-svg-icons/faMusic";
import { faImage } from "@fortawesome/free-solid-svg-icons/faImage";
import { faNewspaper } from "@fortawesome/free-solid-svg-icons/faNewspaper";
import { faQuestion } from "@fortawesome/free-solid-svg-icons/faQuestion";
import {
  SORT_ORDER_VIDEO,
  SORT_ORDER_AUDIO,
  SORT_ORDER_IMAGE,
  SORT_ORDER_PDF,
  SORT_ORDER_MODEL,
  SORT_ORDER_UNIDENTIFIED,
  mediaSortOrder,
  mediaSort
} from "../utils/media-sorting.js";

const THUMBNAIL_TITLE = new Map([
  [SORT_ORDER_VIDEO, "Video"],
  [SORT_ORDER_AUDIO, "Audio"],
  [SORT_ORDER_IMAGE, "Image"],
  [SORT_ORDER_PDF, "PDF"],
  [SORT_ORDER_UNIDENTIFIED, "Unknown Media Type"],
  [SORT_ORDER_MODEL, "Model"]
]);

const DISPLAY_IMAGE = new Map([
  [SORT_ORDER_VIDEO, faVideo],
  [SORT_ORDER_AUDIO, faMusic],
  [SORT_ORDER_IMAGE, faImage],
  [SORT_ORDER_PDF, faNewspaper],
  [SORT_ORDER_UNIDENTIFIED, faQuestion],
  [SORT_ORDER_MODEL, faCube]
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

  componentDidMount() {
    document.querySelector(".a-canvas").addEventListener("mouseup", () => {
      if (this.props.expanded) {
        this.props.onExpand(false, true);
      }
    });
    this.updateMediaEntities = this.updateMediaEntities.bind(this);
    this.updateMediaEntities();
    this.props.scene.addEventListener("listed_media_changed", () => setTimeout(() => this.updateMediaEntities(), 0));
    // HACK: The listed-media component exists before the media-loader component does, in cases where an entity is created from a network template because of an incoming message, so don't updateMediaEntities right away.
    // Sorry in advance for the day this comment is out of date.
  }

  updateMediaEntities() {
    const mediaEntities = [...this.props.scene.systems["listed-media"].els];
    mediaEntities.sort(mediaSort);
    this.setState({ mediaEntities });
  }

  componentDidUpdate() {}

  domForEntity(el, i) {
    return (
      <div
        key={i}
        className={styles.rowNoMargin}
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
          AFRAME.scenes[0].systems["hubs-systems"].cameraSystem.inspect(el.object3D, 1.5, true);
        }}
      >
        <div title={THUMBNAIL_TITLE.get(mediaSortOrder(el))} className={styles.icon}>
          <FontAwesomeIcon icon={DISPLAY_IMAGE.get(mediaSortOrder(el))} />
        </div>
        <div className={classNames({ [styles.listItem]: true })}>
          <div className={styles.presence}>
            <p>{getDisplayString(el)}</p>
          </div>
        </div>
      </div>
    );
  }

  renderExpandedList() {
    return (
      <div className={rootStyles.objectList}>
        <div className={styles.contents}>
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
    return (
      <div>
        <button
          title={"Media"}
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
