import React, { Component } from "react";
import PropTypes from "prop-types";
import { injectIntl, FormattedMessage } from "react-intl";
import classNames from "classnames";

import styles from "../assets/stylesheets/profile.scss";
import hubLogo from "../assets/images/hub-preview-white.png";
import { AVATAR_TYPES, getAvatarType } from "../assets/avatars/avatars";
import { SCHEMA } from "../storage/store";
import { WithHoverSound } from "./wrap-with-audio";
import { handleTextFieldFocus, handleTextFieldBlur } from "../utils/focus-utils";

import AvatarSelector from "./avatar-selector";
import AvatarEditor from "./avatar-editor";

class ProfileEntryPanel extends Component {
  static propTypes = {
    store: PropTypes.object,
    history: PropTypes.object,
    messages: PropTypes.object,
    finished: PropTypes.func,
    intl: PropTypes.object,
    onSignIn: PropTypes.func,
    onSignOut: PropTypes.func,
    signedIn: PropTypes.bool,
    debug: PropTypes.bool,
    preview: PropTypes.bool
  };

  constructor(props) {
    super(props);
    const { displayName, avatarId } = this.props.store.state.profile;
    const avatarType = getAvatarType(avatarId);
    this.state = { displayName, avatarId, avatarType };
    this.props.store.addEventListener("statechanged", this.storeUpdated);
  }

  storeUpdated = () => {
    const { avatarId, displayName } = this.props.store.state.profile;
    this.setState({ avatarId, displayName });
  };

  saveStateAndFinish = e => {
    e && e.preventDefault();

    const { displayName } = this.props.store.state.profile;
    const { hasChangedName } = this.props.store.state.activity;

    const hasChangedNowOrPreviously = hasChangedName || this.state.displayName !== displayName;
    this.props.store.update({
      activity: {
        hasChangedName: hasChangedNowOrPreviously
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

  componentDidMount() {
    // stop propagation so that avatar doesn't move when wasd'ing during text input.
    this.nameInput.addEventListener("keydown", this.stopPropagation);
    this.nameInput.addEventListener("keypress", this.stopPropagation);
    this.nameInput.addEventListener("keyup", this.stopPropagation);
  }

  componentWillUnmount() {
    this.props.store.removeEventListener("statechanged", this.storeUpdated);
    this.nameInput.removeEventListener("keydown", this.stopPropagation);
    this.nameInput.removeEventListener("keypress", this.stopPropagation);
    this.nameInput.removeEventListener("keyup", this.stopPropagation);
  }

  render() {
    const { formatMessage } = this.props.intl;

    let panelBody;
    switch (this.state.avatarType) {
      case AVATAR_TYPES.LEGACY:
        panelBody = <AvatarSelector {...this.props} avatarId={this.state.avatarId} />;
        break;
      case AVATAR_TYPES.SKINNABLE:
        panelBody = (
          <AvatarEditor
            signedIn={this.props.signedIn}
            onSignIn={this.props.onSignIn}
            onSignOut={this.props.onSignOut}
            store={this.props.store}
            onAvatarChanged={avatarId => this.setState({ avatarId })}
            saveStateAndFinish={this.saveStateAndFinish}
            debug={this.props.debug}
            preview={this.props.preview}
          />
        );
        break;
      case AVATAR_TYPES.URL:
        panelBody = (
          <div>
            <label htmlFor="#custom-avatar-url">Avatar GLTF/GLB </label>
            <input
              id="custom-avatar-url"
              type="url"
              required
              className={styles.formFieldText}
              value={this.state.avatarId}
              onChange={e => this.setState({ avatarId: e.target.value })}
            />
            <div className={styles.info}>
              <FormattedMessage id="profile.info" />
              <a target="_blank" rel="noopener noreferrer" href="https://github.com/j-conrad/hubs-avatar-pipelines">
                <FormattedMessage id="profile.info-link" />
              </a>
            </div>
          </div>
        );
        break;
    }

    return (
      <div className={styles.profileEntry}>
        <form onSubmit={this.saveStateAndFinish} className={styles.form}>
          <div className={classNames([styles.box, styles.darkened])}>
            <label htmlFor="#profile-entry-display-name" className={styles.title}>
              <FormattedMessage id="profile.header" />
            </label>
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

            <div className={styles.tabs}>
              <a
                onClick={() => this.setState({ avatarType: "legacy", avatarId: "botdefault" })}
                className={classNames({ selected: this.state.avatarType === "legacy" })}
              >
                <FormattedMessage id="profile.tabs.legacy" />
              </a>
              <a
                onClick={() => this.setState({ avatarType: "skinnable", avatarId: null })}
                className={classNames({ selected: this.state.avatarType === "skinnable" })}
              >
                <FormattedMessage id="profile.tabs.skinnable" />
              </a>
              <a
                onClick={() => this.setState({ avatarType: "url", avatarId: "" })}
                className={classNames({ selected: this.state.avatarType === "url" })}
              >
                <FormattedMessage id="profile.tabs.url" />
              </a>
            </div>
            {panelBody}
            {this.state.avatarType !== AVATAR_TYPES.SKINNABLE && (
              <WithHoverSound>
                <input className={styles.formSubmit} type="submit" value={formatMessage({ id: "profile.save" })} />
              </WithHoverSound>
            )}
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
