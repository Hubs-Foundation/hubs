import React, { Component } from "react";
import PropTypes from "prop-types";
import DialogContainer from "./dialog-container.js";
import { WithHoverSound } from "./wrap-with-audio";
import { FormattedMessage, injectIntl, defineMessage } from "react-intl";

const HUB_NAME_PATTERN = "^.{1,64}$";

const roomNamePlaceholderMessage = defineMessage({
  id: "create-room-dialog.room-name-placeholder",
  defaultMessage: "Room Name"
});

const roomNameRequirementsMessage = defineMessage({
  id: "create-room-dialog.room-name-requirements",
  defaultMessage: "Names must be at most 64 characters."
});

const sceneUrlPlaceholderMessage = defineMessage({
  id: "create-room-dialog.scene-url-placeholder",
  defaultMessage: "URL to Scene GLTF or GLB (Optional)"
});

class CreateRoomDialog extends Component {
  static propTypes = {
    includeScenePrompt: PropTypes.bool,
    onCustomScene: PropTypes.func,
    onClose: PropTypes.func,
    intl: PropTypes.object.isRequired
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
      <DialogContainer
        title={<FormattedMessage id="create-room-dialog.title" defaultMessage="Create a Room" />}
        onClose={onClose}
        {...other}
      >
        <div>
          {this.props.includeScenePrompt ? (
            <div>
              <FormattedMessage
                id="create-room-dialog.scene-and-name-prompt"
                defaultMessage="Choose a name and GLTF URL for your room's scene:"
              />
            </div>
          ) : (
            <div>
              <FormattedMessage id="create-room-dialog.name-prompt" defaultMessage="Choose a name for your room:" />
            </div>
          )}

          <form onSubmit={onCustomSceneClicked}>
            <div className="custom-scene-form">
              <input
                type="text"
                placeholder={this.props.intl.formatMessage(roomNamePlaceholderMessage)}
                className="custom-scene-form__link_field"
                value={this.state.customRoomName}
                pattern={HUB_NAME_PATTERN}
                title={this.props.intl.formatMessage(roomNameRequirementsMessage)}
                onChange={e => this.setState({ customRoomName: e.target.value })}
                required
              />
              {this.props.includeScenePrompt && (
                <input
                  type="url"
                  placeholder={this.props.intl.formatMessage(sceneUrlPlaceholderMessage)}
                  className="custom-scene-form__link_field"
                  value={this.state.customSceneUrl}
                  onChange={e => this.setState({ customSceneUrl: e.target.value })}
                />
              )}
              <div className="custom-scene-form__buttons">
                <WithHoverSound>
                  <button className="custom-scene-form__action-button">
                    <span>
                      <FormattedMessage id="create-room-dialog.create-room-button" defaultMessage="Create Room" />
                    </span>
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

export default injectIntl(CreateRoomDialog);
