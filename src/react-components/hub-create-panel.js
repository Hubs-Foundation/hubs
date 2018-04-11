import React, { Component } from "react";
import PropTypes from "prop-types";
import { injectIntl, FormattedMessage } from "react-intl";
import { generateHubName } from "../utils/name-generation";
import classNames from "classnames";
import faAngleLeft from "@fortawesome/fontawesome-free-solid/faAngleLeft";
import faAngleRight from "@fortawesome/fontawesome-free-solid/faAngleRight";
import FontAwesomeIcon from "@fortawesome/react-fontawesome";

import deafault_scene_preview_thumbnail from "../assets/images/default_thumbnail.png";

const HUB_NAME_PATTERN = "^[A-Za-z0-9-'\":!@#$%^&*(),.?~ ]{4,64}$";

class HubCreatePanel extends Component {
  static propTypes = {
    intl: PropTypes.object,
    environments: PropTypes.array
  };

  constructor(props) {
    super(props);

    this.state = {
      name: generateHubName(),
      environmentIndex: Math.floor(Math.random() * props.environments.length),

      // HACK: expand on small screens by default to ensure scene selection possible.
      // Eventually this could/should be done via media queries.
      expanded: window.innerWidth < 420
    };
  }

  createHub = async e => {
    e.preventDefault();
    const environment = this.props.environments[this.state.environmentIndex];

    const payload = {
      hub: { name: this.state.name, default_environment_gltf_bundle_url: environment.bundle_url }
    };

    const res = await fetch("/api/v1/hubs", {
      body: JSON.stringify(payload),
      headers: { "content-type": "application/json" },
      method: "POST"
    });

    const hub = await res.json();
    document.location = hub.url;
  };

  isHubNameValid = () => {
    const hubAlphaPattern = "[A-Za-z0-9]{4}";
    return new RegExp(HUB_NAME_PATTERN).test(this.state.name) && new RegExp(hubAlphaPattern).test(this.state.name);
  };

  setToEnvironmentOffset = offset => {
    const numEnvs = this.props.environments.length;

    this.setState(state => ({
      environmentIndex: ((state.environmentIndex + offset) % this.props.environments.length + numEnvs) % numEnvs
    }));
  };

  setToNextEnvironment = e => {
    e.preventDefault();
    this.setToEnvironmentOffset(1);
  };

  setToPreviousEnvironment = e => {
    e.preventDefault();
    this.setToEnvironmentOffset(-1);
  };

  shuffle = () => {
    this.setState({
      name: generateHubName(),
      environmentIndex: Math.floor(Math.random() * this.props.environments.length)
    });
  };

  render() {
    const { formatMessage } = this.props.intl;

    if (this.props.environments.length == 0) {
      return <div />;
    }

    const environment = this.props.environments[this.state.environmentIndex];
    const meta = environment.meta || {};

    const environmentTitle = meta.title || environment.name;
    const environmentAuthor = (meta.authors || [])[0];
    const environmentThumbnail = (meta.images || []).find(i => i.type === "preview-thumbnail") || {
      srcset: deafault_scene_preview_thumbnail
    };

    const formNameClassNames = classNames("create-panel__form__name", {
      "create-panel__form__name--expanded": this.state.expanded
    });

    return (
      <form onSubmit={this.createHub}>
        <div className="create-panel">
          {!this.state.expanded && (
            <div className="create-panel__header">
              <FormattedMessage id="home.create_header" />
            </div>
          )}
          <div className="create-panel__form">
            <div
              className="create-panel__form__left-container"
              onClick={e => {
                e.preventDefault();

                if (this.state.expanded) {
                  this.shuffle();
                } else {
                  this.setState({ expanded: true });
                }
              }}
            >
              <button className="create-panel__form__rotate-button">
                {this.state.expanded ? (
                  <img src="../assets/images/dice_icon.svg" />
                ) : (
                  <img src="../assets/images/expand_dots_icon.svg" />
                )}
              </button>
            </div>
            <div className="create-panel__form__right-container" onClick={this.createHub}>
              <button className="create-panel__form__submit-button">
                {this.isHubNameValid() ? (
                  <img src="../assets/images/hub_create_button_enabled.svg" />
                ) : (
                  <img src="../assets/images/hub_create_button_disabled.svg" />
                )}
              </button>
            </div>
            {this.state.expanded && (
              <div className="create-panel__form__environment">
                <div className="create-panel__form__environment__picker">
                  <img
                    className="create-panel__form__environment__picker__image"
                    srcSet={environmentThumbnail.srcset}
                  />
                  <div className="create-panel__form__environment__picker__labels">
                    <div className="create-panel__form__environment__picker__labels__header">
                      <span className="create-panel__form__environment__picker__labels__header__title">
                        {environmentTitle}
                      </span>
                      {environmentAuthor &&
                        environmentAuthor.name && (
                          <span className="create-panel__form__environment__picker__labels__header__author">
                            <FormattedMessage id="home.environment_author_by" />
                            <span>{environmentAuthor.name}</span>
                          </span>
                        )}
                    </div>
                    <div className="create-panel__form__environment__picker__labels__footer">
                      <FormattedMessage id="home.environment_picker_footer" />
                    </div>
                  </div>
                  <div className="create-panel__form__environment__picker__controls">
                    <button
                      className="create-panel__form__environment__picker__controls__prev"
                      onClick={this.setToPreviousEnvironment}
                    >
                      <FontAwesomeIcon icon={faAngleLeft} />
                    </button>

                    <button
                      className="create-panel__form__environment__picker__controls__next"
                      onClick={this.setToNextEnvironment}
                    >
                      <FontAwesomeIcon icon={faAngleRight} />
                    </button>
                  </div>
                </div>
              </div>
            )}
            <input
              className={formNameClassNames}
              value={this.state.name}
              onChange={e => this.setState({ name: e.target.value })}
              onFocus={e => e.target.select()}
              required
              pattern={HUB_NAME_PATTERN}
              title={formatMessage({ id: "home.create_name.validation_warning" })}
            />
          </div>
        </div>
      </form>
    );
  }
}

export default injectIntl(HubCreatePanel);
