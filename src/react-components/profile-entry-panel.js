import React, { Component } from "react";
import PropTypes from "prop-types";
import { injectIntl, FormattedMessage } from "react-intl";
import classNames from "classnames";
import { faPencilAlt } from "@fortawesome/free-solid-svg-icons/faPencilAlt";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { SCHEMA } from "../storage/store";
import styles from "../assets/stylesheets/profile.scss";
import hubLogo from "../assets/images/hub-preview-white.png";
import { WithHoverSound } from "./wrap-with-audio";
import { AVATAR_TYPES, getAvatarGltfUrl, getAvatarType } from "../assets/avatars/avatars";
import { handleTextFieldFocus, handleTextFieldBlur } from "../utils/focus-utils";
import StateLink from "./state-link";

import AvatarPreview from "./avatar-preview";

class ProfileEntryPanel extends Component {
  static propTypes = {
    displayNameOverride: PropTypes.string,
    store: PropTypes.object,
    mediaSearchStore: PropTypes.object,
    messages: PropTypes.object,
    finished: PropTypes.func,
    intl: PropTypes.object,
    history: PropTypes.object
  };

  state = {
    avatarId: null,
    avatarType: null,
    displayName: null,
    avatarGltfUrl: null
  };

  constructor(props) {
    super(props);
    this.state = this.getStateFromProfile();
    this.props.store.addEventListener("statechanged", this.storeUpdated);
    this.scene = document.querySelector("a-scene");
  }

  getStateFromProfile = () => {
    const { displayName, avatarId } = this.props.store.state.profile;
    return { displayName, avatarId, avatarType: getAvatarType(avatarId) };
  };

  storeUpdated = () => this.setState(this.getStateFromProfile());

  saveStateAndFinish = e => {
    e && e.preventDefault();

    const { displayName } = this.props.store.state.profile;
    const { hasChangedName } = this.props.store.state.activity;

    const hasChangedNowOrPreviously = hasChangedName || this.state.displayName !== displayName;
    this.props.store.update({
      activity: {
        hasChangedName: hasChangedNowOrPreviously,
        hasAcceptedProfile: true
      },
      profile: {
        displayName: this.state.displayName,
        avatarId: this.state.avatarId
      }
    });
    this.props.finished();
  };

  stopPropagation = e => {
    e.stopPropagation();
  };

  setAvatarFromMediaResult = ({ detail: entry }) => {
    this.setState({
      avatarId: entry.id,
      avatarType: getAvatarType(entry.id),
      avatarGltfUrl: entry.gltfs.avatar
    });
  };

  async componentDidMount() {
    this.setState({ avatarGltfUrl: await getAvatarGltfUrl(this.state.avatarId) });
    if (this.nameInput) {
      // stop propagation so that avatar doesn't move when wasd'ing during text input.
      this.nameInput.addEventListener("keydown", this.stopPropagation);
      this.nameInput.addEventListener("keypress", this.stopPropagation);
      this.nameInput.addEventListener("keyup", this.stopPropagation);
    }
    this.scene.addEventListener("action_selected_media_result_entry", this.setAvatarFromMediaResult);
  }

  componentWillUnmount() {
    this.props.store.removeEventListener("statechanged", this.storeUpdated);
    if (this.nameInput) {
      this.nameInput.removeEventListener("keydown", this.stopPropagation);
      this.nameInput.removeEventListener("keypress", this.stopPropagation);
      this.nameInput.removeEventListener("keyup", this.stopPropagation);
    }
    this.scene.removeEventListener("action_selected_media_result_entry", this.setAvatarFromMediaResult);
  }

  render() {
    const { formatMessage } = this.props.intl;

    return (
      <div className={styles.profileEntry}>
        <form onSubmit={this.saveStateAndFinish} className={styles.form}>
          <div className={classNames([styles.box, styles.darkened])}>
            <label htmlFor="#profile-entry-display-name" className={styles.title}>
              <FormattedMessage id="profile.header" />
            </label>
            {this.props.displayNameOverride ? (
              <span className={styles.displayName}>{this.props.displayNameOverride}</span>
            ) : (
              <input
                id="profile-entry-display-name"
                className={styles.formFieldText}
                value={this.state.displayName}
                onFocus={e => handleTextFieldFocus(e.target)}
                onBlur={() => handleTextFieldBlur()}
                onChange={e => this.setState({ displayName: e.target.value })}
                required
                spellCheck="false"
                pattern={SCHEMA.definitions.profile.properties.displayName.pattern}
                title={formatMessage({ id: "profile.display_name.validation_warning" })}
                ref={inp => (this.nameInput = inp)}
              />
            )}

            <a
              className={styles.chooseAvatar}
              onClick={() => this.props.mediaSearchStore.sourceNavigateWithNoNav("avatars")}
            >
              <FormattedMessage id="profile.choose_avatar" />
            </a>

            <div className={styles.preview}>
              <AvatarPreview avatarGltfUrl={this.state.avatarGltfUrl} />

              {this.state.avatarType === AVATAR_TYPES.SKINNABLE && (
                <StateLink
                  stateKey="overlay"
                  stateValue="avatar-editor"
                  stateDetail={{ avatarId: this.state.avatarId, hideDelete: true }}
                  history={this.props.history}
                  className={styles.editAvatar}
                >
                  <FontAwesomeIcon icon={faPencilAlt} />
                </StateLink>
              )}
            </div>

            <WithHoverSound>
              <input className={styles.formSubmit} type="submit" value={formatMessage({ id: "profile.save" })} />
            </WithHoverSound>
            <div className={styles.links}>
              <WithHoverSound>
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://github.com/mozilla/hubs/blob/master/TERMS.md"
                >
                  <FormattedMessage id="profile.terms_of_use" />
                </a>
              </WithHoverSound>

              <WithHoverSound>
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://github.com/mozilla/hubs/blob/master/PRIVACY.md"
                >
                  <FormattedMessage id="profile.privacy_notice" />
                </a>
              </WithHoverSound>
            </div>
          </div>
        </form>
        <img className={styles.logo} src={hubLogo} />
      </div>
    );
  }
}

export default injectIntl(ProfileEntryPanel);
