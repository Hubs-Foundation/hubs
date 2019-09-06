import React, { Component } from "react";
import classNames from "classnames";
import rootStyles from "../assets/stylesheets/ui-root.scss";
import styles from "../assets/stylesheets/presence-list.scss";
import DiscordImage from "../assets/images/presence_discord.png";
import HMDImage from "../assets/images/presence_vr.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons/faTrash";
import { faBoxes } from "@fortawesome/free-solid-svg-icons/faBoxes";

export default class ObjectList extends Component {
  static propTypes = {};

  state = {
    expanded: false,
    inspecting: false,
    filteredEntities: []
  };

  componentDidMount() {
    document.querySelector(".a-canvas").addEventListener("mouseup", () => {
      if (this.state.expanded) {
        this.setState({ expanded: false });
      }
      if (this.state.inspecting) {
        this.setState({ inspecting: false });
      }
    });
    this.updateFilteredEntities = this.updateFilteredEntities.bind(this);
    const scene = document.querySelector("a-scene");
    scene.addEventListener("object3dset", this.updateFilteredEntities);
    scene.addEventListener("object3dremove", this.updateFilteredEntities);
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
          this.setState({ inspecting: true });
          AFRAME.scenes[0].systems["hubs-systems"].cameraSystem.inspect(obj.object3D);
        }}
        onMouseOver={() => {
          if (this.state.inspecting) {
            AFRAME.scenes[0].systems["hubs-systems"].cameraSystem.inspect(obj.object3D);
          }
        }}
        onMouseOut={() => {
          if (this.state.inspecting) {
            AFRAME.scenes[0].systems["hubs-systems"].cameraSystem.uninspect();
          }
        }}
        onMouseUp={() => {
          if (this.state.inspecting) {
            this.setState({ inspecting: false });
            AFRAME.scenes[0].systems["hubs-systems"].cameraSystem.uninspect();
          }
        }}
      >
        <div className={styles.icon}>
          <FontAwesomeIcon
            icon={faTrash}
            onClick={() => {
              if (
                !obj.object3D.el.components.networked ||
                NAF.utils.isMine(obj.object3D.el) ||
                NAF.utils.takeOwnership(obj.object3D.el)
              ) {
                if (obj.object3D.el.components["pinnable"]) {
                  obj.object3D.el.setAttribute("pinnable", "pinned", false);
                }
                obj.object3D.el.parentNode.removeChild(obj.object3D.el);
                if (this.state.inspecting) {
                  this.setState({ inspecting: false });
                  AFRAME.scenes[0].systems["hubs-systems"].cameraSystem.uninspect();
                }
                this.updateFilteredEntities();
              }
            }}
          />
        </div>
        <div className={classNames({ [styles.listItem]: true })}>
          <div className={styles.presence}>
            <p>
              {obj.components["media-loader"].data.src.substring(obj.components["media-loader"].data.src.length - 50)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  renderExpandedList() {
    return (
      <div className={styles.presenceList}>
        <div className={styles.attachPoint} />
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
          onClick={() => this.setState({ expanded: !this.state.expanded })}
          className={classNames({
            [rootStyles.objectList]: true,
            [rootStyles.presenceInfoSelected]: this.state.expanded
          })}
        >
          <FontAwesomeIcon icon={faBoxes} />
          <span className={rootStyles.occupantCount}>{this.state.filteredEntities.length}</span>
        </div>
        {this.state.expanded && this.renderExpandedList()}
      </div>
    );
  }
}
