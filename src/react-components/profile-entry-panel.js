import React, { Component } from "react";
import PropTypes from "prop-types";
import { injectIntl, FormattedMessage } from "react-intl";
import classNames from "classnames";
import { faPencilAlt } from "@fortawesome/free-solid-svg-icons/faPencilAlt";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import configs from "../utils/configs";
import IfFeature from "./if-feature";
import { SCHEMA } from "../storage/store";
import styles from "../assets/stylesheets/profile.scss";
import { fetchAvatar } from "../utils/avatar-utils";
import { handleTextFieldFocus, handleTextFieldBlur } from "../utils/focus-utils";
import { replaceHistoryState } from "../utils/history";
import StateLink from "./state-link";
import { faTimes } from "@fortawesome/free-solid-svg-icons/faTimes";

import AvatarPreview from "./avatar-preview";

class ProfileEntryPanel extends Component {
  static propTypes = {
    displayNameOverride: PropTypes.string,
    store: PropTypes.object,
    mediaSearchStore: PropTypes.object,
    messages: PropTypes.object,
    finished: PropTypes.func,
    intl: PropTypes.object,
    history: PropTypes.object,
    avatarId: PropTypes.string,
    onClose: PropTypes.func
  };

  state = {
    avatarId: null,
    displayName: null,
    avatar: null
  };

  constructor(props) {
    super(props);
    this.state = this.getStateFromProfile();
    if (props.avatarId) {
      this.state.avatarId = props.avatarId;
    }
    this.props.store.addEventListener("statechanged", this.storeUpdated);
    this.scene = document.querySelector("a-scene");
  }

  getStateFromProfile = () => {
    const { displayName, avatarId } = this.props.store.state.profile;
    return { displayName, avatarId };
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
    this.scene.emit("avatar_updated");
  };

  stopPropagation = e => {
    e.stopPropagation();
  };

  setAvatarFromMediaResult = ({ detail: { entry, selectAction } }) => {
    if ((entry.type !== "avatar" && entry.type !== "avatar_listing") || selectAction !== "use") return;

    this.setState({ avatarId: entry.id });
    // Replace history state with the current avatar id since this component gets destroyed when we open the
    // avatar editor and we want the back button to work. We read the history state back via the avatarId prop.
    // We read the current state key from history since it could be "overlay" or "entry_step".
    replaceHistoryState(this.props.history, this.props.history.location.state.key, "profile", { avatarId: entry.id });
  };

  componentDidMount() {
    if (this.nameInput) {
      // stop propagation so that avatar doesn't move when wasd'ing during text input.
      this.nameInput.addEventListener("keydown", this.stopPropagation);
      this.nameInput.addEventListener("keypress", this.stopPropagation);
      this.nameInput.addEventListener("keyup", this.stopPropagation);
    }
    this.scene.addEventListener("action_selected_media_result_entry", this.setAvatarFromMediaResult);
    // This handles editing avatars in the entry_step, since this component remains mounted with the same avatarId
    this.scene.addEventListener("action_avatar_saved", this.refetchAvatar);

    this.refetchAvatar();
  }

  componentDidUpdate(_prevProps, prevState) {
    if (prevState.avatarId !== this.state.avatarId) {
      this.refetchAvatar();
    }
  }

  componentWillUnmount() {
    this.props.store.removeEventListener("statechanged", this.storeUpdated);
    if (this.nameInput) {
      this.nameInput.removeEventListener("keydown", this.stopPropagation);
      this.nameInput.removeEventListener("keypress", this.stopPropagation);
      this.nameInput.removeEventListener("keyup", this.stopPropagation);
    }
    this.scene.removeEventListener("action_selected_media_result_entry", this.setAvatarFromMediaResult);
    this.scene.removeEventListener("action_avatar_saved", this.refetchAvatar);
  }

  refetchAvatar = async () => {
    const avatar = await fetchAvatar(this.state.avatarId);
    if (this.state.avatarId !== avatar.avatar_id) return; // This is an old result, ignore it
    this.setState({ avatar });
  };

  render() {
    const { formatMessage } = this.props.intl;

    return (
      <div className={styles.profileEntry}>
        <div className={styles.close}>
          <button autoFocus onClick={() => this.props.onClose()}>
            <i>
              <FontAwesomeIcon icon={faTimes} />
            </i>
          </button>
        </div>
        <form onSubmit={this.saveStateAndFinish} className={styles.form}>
          <div className={classNames([styles.box])}>
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

            {this.state.avatar ? (
              <div className={styles.preview}>
                <AvatarPreview avatarGltfUrl={this.state.avatar.gltf_url} />

                {this.state.avatar.account_id === this.props.store.credentialsAccountId && (
                  <StateLink
                    stateKey="overlay"
                    stateValue="avatar-editor"
                    stateDetail={{ avatarId: this.state.avatarId, hideDelete: true, returnToProfile: true }}
                    history={this.props.history}
                    className={styles.editAvatar}
                  >
                    <FontAwesomeIcon icon={faPencilAlt} />
                  </StateLink>
                )}

                <div className={styles.chooseAvatar}>
                  <a onClick={() => this.props.mediaSearchStore.sourceNavigateWithNoNav("avatars", "use")}>
                    <FormattedMessage id="profile.choose_avatar" />
                  </a>
                </div>
              </div>
            ) : (
              <div className={styles.preview}>
                <AvatarPreview />
                <div className={styles.chooseAvatar}>
                  <a onClick={() => this.props.mediaSearchStore.sourceNavigateWithNoNav("avatars", "use")}>
                    <FormattedMessage id="profile.choose_avatar" />
                  </a>
                </div>
              </div>
            )}

            <input className={styles.formSubmit} type="submit" value={formatMessage({ id: "profile.save" })} />
            <div className={styles.links}>
              <IfFeature name="show_terms">
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={configs.link("terms_of_use", "https://github.com/mozilla/hubs/blob/master/TERMS.md")}
                >
                  <FormattedMessage id="profile.terms_of_use" />
                </a>
              </IfFeature>

              <IfFeature name="show_privacy">
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={configs.link("privacy_notice", "https://github.com/mozilla/hubs/blob/master/PRIVACY.md")}
                >
                  <FormattedMessage id="profile.privacy_notice" />
                </a>
              </IfFeature>
            </div>
          </div>
        </form>
        <img className={styles.logo} src={configs.image("logo")} />
      </div>
    );
  }
}

export default injectIntl(ProfileEntryPanel);
