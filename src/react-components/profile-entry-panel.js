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
    window.store = this.props.store;
    this.state = {
      display_name: this.props.store.state.profile.display_name,
      avatar_id: this.props.store.state.profile.avatar_id
    };
    this.props.store.addEventListener("statechanged", this.storeUpdated);
  }

  storeUpdated = () => {
    const { avatar_id, display_name } = this.props.store.state.profile;
    this.setState({ avatar_id, display_name });
  };

  saveStateAndFinish = e => {
    e.preventDefault();
    this.props.store.update({
      profile: {
        display_name: this.state.display_name,
        avatar_id: this.state.avatar_id
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
    this.setState({ avatar_id: e.data.avatarId });
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
        <form onSubmit={this.saveStateAndFinish}>
          <div className="profile-entry__box profile-entry__box--darkened">
            <div className="profile-entry__subtitle">
              <FormattedMessage id="profile.header" />
            </div>
            <input
              className="profile-entry__form-field-text"
              value={this.state.display_name}
              onChange={e => this.setState({ display_name: e.target.value })}
              required
              pattern={SCHEMA.definitions.profile.properties.display_name.pattern}
              title={formatMessage({ id: "profile.display_name.validation_warning" })}
              ref={inp => (this.nameInput = inp)}
            />
            <iframe
              className="profile-entry__avatar-selector"
              src={
                /* HACK: Have to account for the smoke test server like this. Feels wrong though. */
                `/${/smoke/i.test(location.hostname) ? "smoke-" : ""}avatar-selector.html#avatar_id=${
                  this.state.avatar_id
                }`
              }
              ref={ifr => (this.avatarSelector = ifr)}
            />
            <input className="profile-entry__form-submit" type="submit" value={formatMessage({ id: "profile.save" })} />
          </div>
        </form>
      </div>
    );
  }
}

export default injectIntl(ProfileEntryPanel);
