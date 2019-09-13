import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import rootStyles from "../assets/stylesheets/ui-root.scss";
import styles from "../assets/stylesheets/presence-list.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBoxes } from "@fortawesome/free-solid-svg-icons/faBoxes";
import VideoImage from "../assets/images/presence_desktop.png";
import ImageImage from "../assets/images/presence_phone.png";
import PDFImage from "../assets/images/giphy_logo.png";
import GLTFImage from "../assets/images/mic_granted.png";

function getDisplayImage(el) {
  if (el.components["media-video"]) return VideoImage;
  if (el.components["media-image"]) return ImageImage;
  if (el.components["media-pdf"]) return PDFImage;
  if (el.components["gltf-model-plus"]) return GLTFImage;
  return PDFImage;
}
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

  return `${lessHost} ... ${resourceName.substr(0, 30)}`;
}

export default class ObjectList extends Component {
  static propTypes = {
    onInspectObject: PropTypes.func,
    onExpand: PropTypes.func,
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
  }

  updateFilteredEntities() {
    // Wait one frame for the entity to be removed from the scene.
    setTimeout(() => {
      const filteredEntities = Object.keys(NAF.entities.entities)
        .filter(id => {
          return NAF.entities.entities[id].components.networked.data.template === "#interactable-media";
        })
        .map(id => {
          return NAF.entities.entities[id];
        });
      if (this.state.filteredEntities.length !== filteredEntities.length) {
        this.setState({
          filteredEntities
        });
      }
    }, 0);
  }
  componentDidUpdate() {
    this.updateFilteredEntities();
  }

  domForObject(obj, i) {
    return (
      <div
        key={i}
        className={styles.rowNoMargin}
        onMouseDown={() => {
          this.props.onExpand(false, false);
          this.props.onInspectObject(obj.object3D, getDisplayString(obj));
        }}
        onMouseOut={() => {
          if (this.props.expanded && !AFRAME.utils.device.isMobileVR()) {
            AFRAME.scenes[0].systems["hubs-systems"].cameraSystem.uninspect();
          }
        }}
        onMouseOver={() => {
          AFRAME.scenes[0].systems["hubs-systems"].cameraSystem.uninspect();
          AFRAME.scenes[0].systems["hubs-systems"].cameraSystem.inspect(obj.object3D, 1.5);
        }}
      >
        <div className={styles.icon}>
          <img src={getDisplayImage(obj)} />
        </div>
        <div className={classNames({ [styles.listItem]: true })}>
          <div className={styles.presence}>
            <p>{getDisplayString(obj)}</p>
          </div>
        </div>
      </div>
    );
  }

  renderExpandedList() {
    return (
      <div className={styles.presenceList}>
        <div className={styles.contents}>
          <div className={styles.rows}>{this.state.filteredEntities.map(this.domForObject.bind(this))}</div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div>
        <div
          onClick={() => {
            this.props.onExpand(!this.props.expanded, !AFRAME.utils.device.isMobileVR());
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
