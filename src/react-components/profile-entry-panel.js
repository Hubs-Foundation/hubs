import React, { Component } from "react";
import PropTypes from "prop-types";
import { injectIntl, FormattedMessage } from "react-intl";
import { SCHEMA } from "../storage/store";

class ProfileEntryPanel extends Component {
  static propTypes = {
    store: PropTypes.object,
    messages: PropTypes.object,
    finished: PropTypes.func,
    intl: PropTypes.object
  };

  constructor(props) {
    super(props);
    const { displayName, avatarId } = this.props.store.state.profile;
    this.state = { displayName, avatarId };
    this.props.store.addEventListener("statechanged", this.storeUpdated);
  }

  storeUpdated = () => {
    const { avatarId, displayName } = this.props.store.state.profile;
    this.setState({ avatarId, displayName });
  };

  saveStateAndFinish = e => {
    e.preventDefault();

    const { displayName } = this.props.store.state.profile;
    const { hasChangedName } = this.props.store.state.activity;

    const hasChangedNowOrPreviously = hasChangedName || this.state.displayName !== displayName;
    this.props.store.update({
      activity: {
        hasChangedName: hasChangedNowOrPreviously
      },
      profile: {
        ...this.state
      }
    });
    this.props.finished();
  };

  stopPropagation = e => {
    e.stopPropagation();
  };

  setAvatarStateFromIframeMessage = e => {
    if (e.source !== this.avatarSelector.contentWindow) {
      return;
    }
    this.setState({ avatarId: e.data.avatarId });
  };

  componentDidMount() {
    // stop propagation so that avatar doesn't move when wasd'ing during text input.
    this.nameInput.addEventListener("keydown", this.stopPropagation);
    this.nameInput.addEventListener("keypress", this.stopPropagation);
    this.nameInput.addEventListener("keyup", this.stopPropagation);
    window.addEventListener("message", this.setAvatarStateFromIframeMessage);
  }

  componentWillUnmount() {
    this.props.store.removeEventListener("statechanged", this.storeUpdated);
    this.nameInput.removeEventListener("keydown", this.stopPropagation);
    this.nameInput.removeEventListener("keypress", this.stopPropagation);
    this.nameInput.removeEventListener("keyup", this.stopPropagation);
    window.removeEventListener("message", this.setAvatarStateFromIframeMessage);
  }

  render() {
    const { formatMessage } = this.props.intl;

    return (
      <div className="profile-entry">
        <form onSubmit={this.saveStateAndFinish} className="profile-entry__form">
          <div className="profile-entry__box profile-entry__box--darkened">
            <label htmlFor="#profile-entry-display-name" className="profile-entry__subtitle">
              <FormattedMessage id="profile.header" />
            </label>
            <label>
              <input
                id="profile-entry-display-name"
                className="profile-entry__form-field-text"
                value={this.state.displayName}
                onFocus={e => e.target.select()}
                onChange={e => this.setState({ displayName: e.target.value })}
                required
                spellCheck="false"
                pattern={SCHEMA.definitions.profile.properties.displayName.pattern}
                title={formatMessage({ id: "profile.display_name.validation_warning" })}
                ref={inp => (this.nameInput = inp)}
              />
            </label>
            <div className="profile-entry__avatar-selector-container">
              <div className="loading-panel">
                <div className="loader-wrap">
                  <div className="loader">
                    <div className="loader-center" />
                  </div>
                </div>
              </div>
              <iframe
                className="profile-entry__avatar-selector"
                src={`/avatar-selector.html#avatar_id=${this.state.avatarId}`}
                ref={ifr => (this.avatarSelector = ifr)}
              />
            </div>
            <input className="profile-entry__form-submit" type="submit" value={formatMessage({ id: "profile.save" })} />
            <div className="profile-entry__box__links">
              <a target="_blank" rel="noopener noreferrer" href="https://github.com/mozilla/hubs/blob/master/TERMS.md">
                <FormattedMessage id="profile.terms_of_use" />
              </a>
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://github.com/mozilla/hubs/blob/master/PRIVACY.md"
              >
                <FormattedMessage id="profile.privacy_notice" />
              </a>
            </div>
          </div>
        </form>
      </div>
    );
  }
}

export default injectIntl(ProfileEntryPanel);
