import React, { Component } from "react";
import PropTypes from "prop-types";
import DialogContainer from "./dialog-container.js";
import { AudioContext } from "../AudioContext";

const HUB_NAME_PATTERN = "^[A-Za-z0-9-'\":!@#$%^&*(),.?~ ]{4,64}$";

export default class CreateRoomDialog extends Component {
  static propTypes = {
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
          <div>Choose a name and GLTF URL for your room&apos;s scene:</div>
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
              <input
                type="url"
                placeholder="URL to Scene GLTF or GLB (Optional)"
                className="custom-scene-form__link_field"
                value={this.state.customSceneUrl}
                onChange={e => this.setState({ customSceneUrl: e.target.value })}
              />
              <div className="custom-scene-form__buttons">
                <AudioContext.Consumer>
                  {audio => (
                    <button
                      className="custom-scene-form__action-button"
                      onMouseEnter={audio.onMouseEnter}
                      onMouseLeave={audio.onMouseLeave}
                    >
                      <span>create</span>
                    </button>
                  )}
                </AudioContext.Consumer>
              </div>
            </div>
          </form>
        </div>
      </DialogContainer>
    );
  }
}
