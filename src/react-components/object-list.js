import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import rootStyles from "../assets/stylesheets/ui-root.scss";
import styles from "../assets/stylesheets/presence-list.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBoxes } from "@fortawesome/free-solid-svg-icons/faBoxes";

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
          this.props.onInspectObject(obj.object3D);
        }}
        onMouseOut={() => {
          if (this.props.expanded) {
            AFRAME.scenes[0].systems["hubs-systems"].cameraSystem.uninspect();
          }
        }}
        onMouseOver={() => {
          AFRAME.scenes[0].systems["hubs-systems"].cameraSystem.uninspect();
          AFRAME.scenes[0].systems["hubs-systems"].cameraSystem.inspect(obj.object3D, 1.5);
        }}
      >
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
            this.props.onExpand(!this.props.expanded, true);
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
