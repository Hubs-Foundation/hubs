import React, { Component } from "react";
import PropTypes from "prop-types";
import { injectIntl, FormattedMessage } from "react-intl";
import { generateHubName } from "../utils/name-generation";

class HubCreatePanel extends Component {
  static propTypes = {
    intl: PropTypes.object,
    environments: PropTypes.array
  };

  state = {
    name: generateHubName(),
    environmentBundleUrl: ""
  };

  constructor() {
    this.setState({ environmentBundleUrl: this.props.environments[0].bundle_url });
  }

  createHub = async e => {
    e.preventDefault();

    const payload = {
      hub: { name: this.state.name, default_environment_gltf_bundle_url: this.state.environmentBundleUrl }
    };

    const res = await fetch("/api/v1/hubs", {
      body: JSON.stringify(payload),
      headers: { "content-type": "application/json" },
      method: "POST"
    });

    const hub = await res.json();
    document.location = hub.url;
  };

  render() {
    const { formatMessage } = this.props.intl;

    if (this.props.environments.length == 0) {
      return <div />;
    }

    const environmentChoices = this.props.environments.map(e => (
      <option key={e.bundle_url} value={e.bundle_url}>
        {e.meta.title}
      </option>
    ));

    return (
      <form onSubmit={this.createHub}>
        <div className="create-panel">
          <div className="create-panel__header">
            <FormattedMessage id="home.create_header" />
          </div>
          <div className="create-panel__form">
            <input
              className="create-panel__form__name"
              value={this.state.name}
              onChange={e => this.setState({ name: e.target.value })}
              onFocus={e => e.target.select()}
              required
              pattern={"^[A-Za-z0-9-'\":!@#$%^&*(),.?~ ]{4,64}$"}
              title={formatMessage({ id: "home.create_name.validation_warning" })}
            />
            <select value={this.state.environmentBundleUrl}>{environmentChoices}</select>
            <button
              onClick={e => {
                e.preventDefault();
                this.setState({ name: generateHubName() });
              }}
            >
              Rotate
            </button>
            <input type="submit" value={formatMessage({ id: "home.create_button" })} />
          </div>
        </div>
      </form>
    );
  }
}

export default injectIntl(HubCreatePanel);
