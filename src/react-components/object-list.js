import React, { Component } from "react";
import classNames from "classnames";
import rootStyles from "../assets/stylesheets/ui-root.scss";
import styles from "../assets/stylesheets/presence-list.scss";
import DiscordImage from "../assets/images/presence_discord.png";
import HMDImage from "../assets/images/presence_vr.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers } from "@fortawesome/free-solid-svg-icons/faUsers";

export default class ObjectList extends Component {
  static propTypes = {};

  state = {
    expanded: false,
    filteredEntities: []
  };

  componentDidMount() {
    document.querySelector(".a-canvas").addEventListener("mouseup", () => {
      if (this.state.expanded) {
        this.setState({ expanded: false });
      }
    });
  }
  updateFilteredEntities() {
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
  }
  componentDidUpdate() {
    this.updateFilteredEntities();
  }

  domForObject(obj, i) {
    const update = this.updateFilteredEntities.bind(this);
    return (
      <div
        key={i}
        className={styles.rowNoMargin}
        onMouseOver={() => {
          AFRAME.scenes[0].systems["hubs-systems"].cameraSystem.inspect(obj.object3D);
        }}
        onMouseOut={() => {
          AFRAME.scenes[0].systems["hubs-systems"].cameraSystem.uninspect();
        }}
      >
        <div className={styles.icon}>
          <img
            src={DiscordImage}
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
                update();
              }
            }}
          />
        </div>
        <div className={classNames({ [styles.listItem]: true })}>
          <div className={styles.presence}>
            <p>
              {obj.components["media-loader"].data.src.substring(obj.components["media-loader"].data.src.length - 20)}
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
          <FontAwesomeIcon icon={faUsers} />
          <span className={rootStyles.occupantCount}>{this.state.filteredEntities.length}</span>
        </div>
        {this.state.expanded && this.renderExpandedList()}
      </div>
    );
  }
}
