import React, { Component } from "react";
import PropTypes from "prop-types";
import { injectIntl, FormattedMessage } from "react-intl";
import { generateHubName } from "../utils/name-generation";
import classNames from "classnames";
import { faAngleLeft } from "@fortawesome/free-solid-svg-icons/faAngleLeft";
import { faAngleRight } from "@fortawesome/free-solid-svg-icons/faAngleRight";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { resolveURL, extractUrlBase } from "../utils/resolveURL";

import default_scene_preview_thumbnail from "../assets/images/default_thumbnail.png";

const HUB_NAME_PATTERN = "^[A-Za-z0-9-'\":!@#$%^&*(),.?~ ]{4,64}$";

class HubCreatePanel extends Component {
  static propTypes = {
    intl: PropTypes.object,
    environments: PropTypes.array,
    initialEnvironment: PropTypes.string
  };

  constructor(props) {
    super(props);

    let environmentIndex = Math.floor(Math.random() * props.environments.length);

    if (props.initialEnvironment) {
      environmentIndex = props.environments.findIndex(
        e => e.name.toLowerCase() === props.initialEnvironment.toLowerCase()
      );
    }

    this.state = {
      ready: false,
      name: generateHubName(),
      environmentIndex,
      // HACK: expand on small screens by default to ensure scene selection possible.
      // Eventually this could/should be done via media queries.
      expanded: window.innerWidth < 420
    };

    // Optimisticly preload all environment thumbnails
    (async () => {
      const environmentThumbnails = props.environments.map((_, i) => this._getEnvironmentThumbnail(i));
      await Promise.all(
        environmentThumbnails.map(environmentThumbnail => this._preloadImage(environmentThumbnail.srcset))
      );
      this.setState({ ready: true });
    })();
  }

  _getEnvironmentThumbnail = environmentIndex => {
    const environment = this.props.environments[environmentIndex];
    const meta = environment.meta || {};

    let environmentThumbnail = {
      srcset: default_scene_preview_thumbnail
    };

    if (meta.images) {
      const thumbnailImage = meta.images.find(i => i.type === "preview-thumbnail");

      if (thumbnailImage) {
        const baseURL = new URL(extractUrlBase(environment.bundle_url), window.location.href);

        environmentThumbnail = {
          srcset: resolveURL(thumbnailImage.srcset, baseURL)
        };
      }
    }

    return environmentThumbnail;
  };

  createHub = async e => {
    e.preventDefault();
    const environment = this.props.environments[this.state.environmentIndex];

    const payload = {
      hub: { name: this.state.name, default_environment_gltf_bundle_url: environment.bundle_url }
    };

    let createUrl = "/api/v1/hubs";

    if (process.env.NODE_ENV === "development") {
      createUrl = `https://${process.env.DEV_RETICULUM_SERVER}${createUrl}`;
    }

    const res = await fetch(createUrl, {
      body: JSON.stringify(payload),
      headers: { "content-type": "application/json" },
      method: "POST"
    });

    const hub = await res.json();

    if (process.env.NODE_ENV === "production" || document.location.host === process.env.DEV_RETICULUM_SERVER) {
      document.location = hub.url;
    } else {
      document.location = `/hub.html?hub_id=${hub.hub_id}`;
    }
  };

  isHubNameValid = () => {
    const hubAlphaPattern = "[A-Za-z0-9]{4}";
    return new RegExp(HUB_NAME_PATTERN).test(this.state.name) && new RegExp(hubAlphaPattern).test(this.state.name);
  };

  _preloadImage = async srcset => {
    const img = new Image();
    const imgLoad = new Promise(resolve => img.addEventListener("load", resolve));
    img.srcset = srcset;
    await imgLoad;
  };

  setToEnvironmentOffset = async offset => {
    const numEnvs = this.props.environments.length;

    const environmentIndex = (((this.state.environmentIndex + offset) % numEnvs) + numEnvs) % numEnvs;
    const environmentThumbnail = this._getEnvironmentThumbnail(environmentIndex);
    await this._preloadImage(environmentThumbnail.srcset);

    this.setState({ environmentIndex });
  };

  setToNextEnvironment = () => {
    this.setToEnvironmentOffset(1);
  };

  setToPreviousEnvironment = () => {
    this.setToEnvironmentOffset(-1);
  };

  shuffle = () => {
    this.setState({
      name: generateHubName(),
      environmentIndex: Math.floor(Math.random() * this.props.environments.length)
    });
  };

  render() {
    if (!this.state.ready) return null;
    const { formatMessage } = this.props.intl;

    if (this.props.environments.length == 0) {
      return <div />;
    }

    const environment = this.props.environments[this.state.environmentIndex];
    const meta = environment.meta || {};

    const environmentTitle = meta.title || environment.name;
    const environmentAuthor = (meta.authors || [])[0];
    const environmentThumbnail = this._getEnvironmentThumbnail(this.state.environmentIndex);

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
              onClick={async () => {
                if (this.state.expanded) {
                  this.shuffle();
                } else {
                  await this._preloadImage(this._getEnvironmentThumbnail(this.state.environmentIndex).srcset);
                  this.setState({ expanded: true });
                }
              }}
            >
              <button type="button" tabIndex="3" className="create-panel__form__rotate-button">
                {this.state.expanded ? (
                  <img src="../assets/images/dice_icon.svg" />
                ) : (
                  <img src="../assets/images/expand_dots_icon.svg" />
                )}
              </button>
            </div>
            <div className="create-panel__form__right-container">
              <button type="submit" tabIndex="5" className="create-panel__form__submit-button">
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
                      {meta.url ? (
                        <a
                          href={meta.url}
                          rel="noopener noreferrer"
                          className="create-panel__form__environment__picker__labels__header__title"
                        >
                          {environmentTitle}
                        </a>
                      ) : (
                        <span className="create-panel__form__environment__picker__labels__header__title">
                          environmentTitle
                        </span>
                      )}
                      {environmentAuthor &&
                        environmentAuthor.name &&
                        (environmentAuthor.url ? (
                          <a
                            href={environmentAuthor.url}
                            rel="noopener noreferrer"
                            className="create-panel__form__environment__picker__labels__header__author"
                          >
                            <FormattedMessage id="home.environment_author_by" />
                            <span>{environmentAuthor.name}</span>
                          </a>
                        ) : (
                          <span className="create-panel__form__environment__picker__labels__header__author">
                            <FormattedMessage id="home.environment_author_by" />
                            <span>{environmentAuthor.name}</span>
                          </span>
                        ))}
                      {environmentAuthor &&
                        environmentAuthor.organization &&
                        (environmentAuthor.organization.url ? (
                          <a
                            href={environmentAuthor.organization.url}
                            rel="noopener noreferrer"
                            className="create-panel__form__environment__picker__labels__header__org"
                          >
                            <span>{environmentAuthor.organization.name}</span>
                          </a>
                        ) : (
                          <span className="create-panel__form__environment__picker__labels__header__org">
                            <span>{environmentAuthor.organization.name}</span>
                          </span>
                        ))}
                    </div>
                    <div className="create-panel__form__environment__picker__labels__footer">
                      <FormattedMessage id="home.environment_picker_footer" />
                    </div>
                  </div>
                  <div className="create-panel__form__environment__picker__controls">
                    <button
                      className="create-panel__form__environment__picker__controls__prev"
                      type="button"
                      tabIndex="1"
                      onClick={this.setToPreviousEnvironment}
                    >
                      <FontAwesomeIcon icon={faAngleLeft} />
                    </button>

                    <button
                      className="create-panel__form__environment__picker__controls__next"
                      type="button"
                      tabIndex="2"
                      onClick={this.setToNextEnvironment}
                    >
                      <FontAwesomeIcon icon={faAngleRight} />
                    </button>
                  </div>
                </div>
              </div>
            )}
            <input
              tabIndex="4"
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
