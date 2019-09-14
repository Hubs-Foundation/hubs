import React, { Component } from "react";
import PropTypes from "prop-types";
import DialogContainer from "./dialog-container.js";
import styles from "../assets/stylesheets/client-info-dialog.scss";
import { FormattedMessage } from "react-intl";

export default class ObjectInfoDialog extends Component {
  static propTypes = {
    scene: PropTypes.object,
    el: PropTypes.object,
    objectDisplayString: PropTypes.string,
    onClose: PropTypes.func,
    hubChannel: PropTypes.object
  };

  state = {
    pinned: false
  };

  componentDidMount() {
    this.updatePinnedState = this.updatePinnedState.bind(this);
    this.pin = this.pin.bind(this);
    this.unpin = this.unpin.bind(this);
    this.props.scene.addEventListener("uninspect", this.props.onClose);
    this.updatePinnedState();
  }

  updatePinnedState() {
    this.setState({ pinned: this.props.el.components["networked"].data.persistent });
  }

  pin() {
    if (!NAF.utils.isMine(this.props.el) && !NAF.utils.takeOwnership(this.props.el)) return;
    this.props.el.emit("pinned", { el: this.props.el });
    this.props.el.setAttribute("pinnable", "pinned", true);
    this.updatePinnedState();
  }

  unpin() {
    if (!NAF.utils.isMine(this.props.el) && !NAF.utils.takeOwnership(this.props.el)) return;
    this.props.el.emit("unpinned", { el: this.props.el });
    this.props.el.setAttribute("pinnable", "pinned", false);
    this.updatePinnedState();
  }

  delete() {
    const targetEl = this.props.el;

    if (!NAF.utils.isMine(targetEl) && !NAF.utils.takeOwnership(targetEl)) return;

    targetEl.setAttribute("animation__remove", {
      property: "scale",
      dur: 200,
      to: { x: 0.01, y: 0.01, z: 0.01 },
      easing: "easeInQuad"
    });

    targetEl.addEventListener("animationcomplete", () => {
      this.props.scene.systems["hubs-systems"].cameraSystem.uninspect();
      NAF.utils.takeOwnership(targetEl);
      targetEl.parentNode.removeChild(targetEl);
      this.props.onClose();
    });
  }

  render() {
    const { onClose } = this.props;

    return (
      <DialogContainer noOverlay={true} wide={true} {...this.props}>
        <div className={styles.roomInfo}>
          <p>{this.props.objectDisplayString}</p>
          <div className={styles.clientActionButtons}>
            {this.props.scene.is("entered") &&
              !this.state.pinned &&
              this.props.hubChannel &&
              this.props.hubChannel.can("spawn_and_move_media") && (
                <button onClick={this.delete.bind(this)}>
                  <FormattedMessage id="object-info.delete-button" />
                </button>
              )}
            {this.props.scene.is("entered") &&
              this.props.hubChannel &&
              this.props.hubChannel.can("pin_objects") && (
                <button onClick={this.state.pinned ? this.unpin : this.pin}>
                  <FormattedMessage id={`object-info.${this.state.pinned ? "unpin-button" : "pin-button"}`} />
                </button>
              )}
            <button className={styles.cancel} onClick={onClose}>
              <FormattedMessage id="client-info.cancel" />
            </button>
          </div>
        </div>
      </DialogContainer>
    );
  }
}
