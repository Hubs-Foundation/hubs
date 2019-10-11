import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import rootStyles from "../assets/stylesheets/ui-root.scss";
import styles from "../assets/stylesheets/presence-list.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBoxes } from "@fortawesome/free-solid-svg-icons/faBoxes";
import { faBox } from "@fortawesome/free-solid-svg-icons/faBox";
import { faVideo } from "@fortawesome/free-solid-svg-icons/faVideo";
import { faImage } from "@fortawesome/free-solid-svg-icons/faImage";
import { faNewspaper } from "@fortawesome/free-solid-svg-icons/faNewspaper";
import { faQuestion } from "@fortawesome/free-solid-svg-icons/faQuestion";

const SORT_ORDER_VIDEO = 0;
const SORT_ORDER_IMAGE = 1;
const SORT_ORDER_PDF = 2;
const SORT_ORDER_MODEL = 3;
const SORT_ORDER_UNIDENTIFIED = 4;
function mediaSortOrder(el) {
  if (el.components["media-video"]) return SORT_ORDER_VIDEO;
  if (el.components["media-image"]) return SORT_ORDER_IMAGE;
  if (el.components["media-pdf"]) return SORT_ORDER_PDF;
  if (el.components["gltf-model-plus"]) return SORT_ORDER_MODEL;
  return SORT_ORDER_UNIDENTIFIED;
}

function mediaSort(el1, el2) {
  return mediaSortOrder(el1) - mediaSortOrder(el2);
}

const THUMBNAIL_TITLE = new Map([
  [SORT_ORDER_VIDEO, "Video"],
  [SORT_ORDER_IMAGE, "Image"],
  [SORT_ORDER_PDF, "PDF"],
  [SORT_ORDER_UNIDENTIFIED, "Unknown Media Type"],
  [SORT_ORDER_MODEL, "Model"]
]);

const DISPLAY_IMAGE = new Map([
  [SORT_ORDER_VIDEO, faVideo],
  [SORT_ORDER_IMAGE, faImage],
  [SORT_ORDER_PDF, faNewspaper],
  [SORT_ORDER_UNIDENTIFIED, faQuestion],
  [SORT_ORDER_MODEL, faBox]
]);

function getDisplayString(el) {
  const url = el.components["media-loader"].data.src;
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
    filteredEntities: []
  };

  componentDidMount() {
    document.querySelector(".a-canvas").addEventListener("mouseup", () => {
      if (this.props.expanded) {
        this.props.onExpand(false, true);
      }
    });
    this.updateFilteredEntities = this.updateFilteredEntities.bind(this);
    this.observer = new MutationObserver(this.updateFilteredEntities);
    this.observer.observe(this.props.scene, { childList: true, attributes: true, subtree: true });
    this.updateFilteredEntities();
  }

  updateFilteredEntities() {
    const filteredEntities = Object.keys(NAF.entities.entities)
      .filter(id => {
        return (
          NAF.entities.entities[id] &&
          NAF.entities.entities[id].components &&
          NAF.entities.entities[id].components.networked &&
          NAF.entities.entities[id].components.networked.data &&
          NAF.entities.entities[id].components.networked.data.template === "#interactable-media"
        );
      })
      .map(id => {
        return NAF.entities.entities[id];
      })
      .sort(mediaSort);
    if (this.state.filteredEntities.length !== filteredEntities.length) {
      this.setState({
        filteredEntities
      });
    }
  }
  componentDidUpdate() {}

  domForEntity(el, i) {
    return (
      <div
        key={i}
        className={styles.rowNoMargin}
        onMouseDown={() => {
          this.props.onExpand(false, false);
          this.props.onInspectObject(el, el.components["media-loader"].data.src);
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
      <div className={styles.presenceList}>
        <div className={styles.contents}>
          <div className={styles.rows}>{this.state.filteredEntities.map(this.domForEntity.bind(this))}</div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div>
        <div
          title={"Media"}
          onClick={() => {
            this.props.onExpand(
              !this.props.expanded && this.state.filteredEntities.length > 0,
              !AFRAME.utils.device.isMobileVR()
            );
          }}
          className={classNames({
            [rootStyles.objectList]: true,
            [rootStyles.presenceInfoSelected]: this.props.expanded
          })}
        >
          <FontAwesomeIcon icon={faBoxes} />
          <span className={rootStyles.occupantCount}>{this.state.filteredEntities.length}</span>
        </div>
        {this.props.expanded && this.renderExpandedList()}
      </div>
    );
  }
}
