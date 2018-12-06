import React, { Component } from "react";
import PropTypes from "prop-types";
import DialogContainer from "./dialog-container.js";
import { WithHoverSound } from "./wrap-with-audio";

const HUB_NAME_PATTERN = "^[A-Za-z0-9-'\":!@#$%^&*(),.?~ ]{4,64}$";

export default class CreateRoomDialog extends Component {
  static propTypes = {
    includeScenePrompt: PropTypes.bool,
    onCustomScene: PropTypes.func,
    onClose: PropTypes.func
  };

  state = {
    customRoomName: "",
    customSceneUrl: ""
  };

  render() {
    const { onCustomScene, onClose, ...other } = this.props;
    const onCustomSceneClicked = () => {
      onCustomScene(this.state.customRoomName, this.state.customSceneUrl);
      onClose();
    };

    return (
      <DialogContainer title="Create a Room" onClose={onClose} {...other}>
        <div>
          {this.props.includeScenePrompt ? (
            <div>Choose a name and GLTF URL for your room&apos;s scene:</div>
          ) : (
            <div>Choose a name for your room:</div>
          )}

          <form onSubmit={onCustomSceneClicked}>
            <div className="custom-scene-form">
              <input
                type="text"
                placeholder="Room name"
                className="custom-scene-form__link_field"
                value={this.state.customRoomName}
                pattern={HUB_NAME_PATTERN}
                title="Invalid name, limited to 4 to 64 characters and limited symbols."
                onChange={e => this.setState({ customRoomName: e.target.value })}
                required
              />
              {this.props.includeScenePrompt && (
                <input
                  type="url"
                  placeholder="URL to Scene GLTF or GLB (Optional)"
                  className="custom-scene-form__link_field"
                  value={this.state.customSceneUrl}
                  onChange={e => this.setState({ customSceneUrl: e.target.value })}
                />
              )}
              <div className="custom-scene-form__buttons">
                <WithHoverSound>
                  <button className="custom-scene-form__action-button">
                    <span>Create Room</span>
                  </button>
                </WithHoverSound>
              </div>
            </div>
          </form>
        </div>
      </DialogContainer>
    );
  }
}
