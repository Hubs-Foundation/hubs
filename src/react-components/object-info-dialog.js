import React, { Component } from "react";
import PropTypes from "prop-types";
import DialogContainer from "./dialog-container.js";
import styles from "../assets/stylesheets/client-info-dialog.scss";
import { FormattedMessage } from "react-intl";

export default class ObjectInfoDialog extends Component {
  static propTypes = {
    scene: PropTypes.object,
    object: PropTypes.object,
    objectDisplayString: PropTypes.string,
    onClose: PropTypes.func,
    hubChannel: PropTypes.object
  };

  componentDidMount() {
    this.props.scene.addEventListener("uninspect", this.props.onClose);
  }

  delete() {
    this.props.scene.systems["hubs-systems"].cameraSystem.uninspect();
    setTimeout(() => {
      this.props.object.el.parentNode.removeChild(this.props.object.el);
      this.props.onClose();
    }, 0);
  }

  render() {
    const { onClose } = this.props;

    return (
      <DialogContainer noOverlay={true} wide={true} {...this.props}>
        <div className={styles.roomInfo}>
          <p>{this.props.objectDisplayString}</p>
          <div className={styles.clientActionButtons}>
            {this.props.hubChannel &&
              this.props.hubChannel.can("spawn_and_move_media") && (
                <button onClick={this.delete.bind(this)}>
                  <FormattedMessage id="object-info.delete-button" />
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
