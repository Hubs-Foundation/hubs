import React, { Component } from "react";
import PropTypes from "prop-types";
import { injectIntl, FormattedMessage } from "react-intl";
import { SCHEMA } from "../storage/store";

class ProfileEntryPanel extends Component {
  static propTypes = {
    store: PropTypes.object,
    messages: PropTypes.object,
    finished: PropTypes.func,
    htmlPrefix: PropTypes.string,
    intl: PropTypes.object
  };

  constructor(props) {
    super(props);
    const { display_name, avatar_id } = this.props.store.state.profile;
    this.state = { display_name, avatar_id };
    this.props.store.addEventListener("statechanged", this.storeUpdated);
  }

  storeUpdated = () => {
    const { avatar_id, display_name } = this.props.store.state.profile;
    this.setState({ avatar_id, display_name });
  };

  saveStateAndFinish = e => {
    e.preventDefault();
    const has_agreed_to_terms = this.props.store.state.profile.has_agreed_to_terms || this.state.has_agreed_to_terms;
    if (!has_agreed_to_terms) return;
    const { has_changed_name, display_name } = this.props.store.state.profile;
    const hasChangedName = has_changed_name || this.state.display_name !== display_name;
    this.props.store.update({
      profile: {
        has_agreed_to_terms: true,
        has_changed_name: hasChangedName,
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
            <label>
              <span className="profile-entry__display-name-label">
                <FormattedMessage id="profile.display_name.label" />
              </span>
              <input
                className="profile-entry__form-field-text"
                value={this.state.display_name}
                onChange={e => this.setState({ display_name: e.target.value })}
                required
                pattern={SCHEMA.definitions.profile.properties.display_name.pattern}
                title={formatMessage({ id: "profile.display_name.validation_warning" })}
                ref={inp => (this.nameInput = inp)}
              />
            </label>
            <iframe
              className="profile-entry__avatar-selector"
              src={`/${this.props.htmlPrefix}avatar-selector.html#avatar_id=${this.state.avatar_id}`}
              ref={ifr => (this.avatarSelector = ifr)}
            />
            {!this.props.store.state.profile.has_agreed_to_terms && (
              <label className="profile-entry__terms">
                <input
                  className="profile-entry__terms__checkbox"
                  type="checkbox"
                  required
                  value={this.state.has_agreed_to_terms}
                  onChange={e => this.setState({ has_agreed_to_terms: e.target.checked })}
                />
                <span className="profile-entry__terms__text">
                  <FormattedMessage id="profile.terms.prefix" />{" "}
                  <a className="profile-entry__terms__link" target="_blank" href="/privacy">
                    <FormattedMessage id="profile.terms.privacy" />
                  </a>{" "}
                  <FormattedMessage id="profile.terms.conjunction" />{" "}
                  <a className="profile-entry__terms__link" target="_blank" href="/terms">
                    <FormattedMessage id="profile.terms.tou" />
                  </a>
                  <FormattedMessage id="profile.terms.suffix" />
                </span>
              </label>
            )}
            <input className="profile-entry__form-submit" type="submit" value={formatMessage({ id: "profile.save" })} />
          </div>
        </form>
      </div>
    );
  }
}

export default injectIntl(ProfileEntryPanel);
