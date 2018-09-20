import React, { Component } from "react";
import PropTypes from "prop-types";
import { injectIntl, FormattedMessage } from "react-intl";
import { generateHubName } from "../utils/name-generation";
import { faAngleLeft } from "@fortawesome/free-solid-svg-icons/faAngleLeft";
import { faAngleRight } from "@fortawesome/free-solid-svg-icons/faAngleRight";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { resolveURL, extractUrlBase } from "../utils/resolveURL";
import { getReticulumFetchUrl } from "../utils/phoenix-utils";
import CreateRoomDialog from "./create-room-dialog.js";

import default_scene_preview_thumbnail from "../assets/images/default_thumbnail.png";
import styles from "../assets/stylesheets/hub-create.scss";

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
      showCustomSceneDialog: false,
      customSceneUrl: null
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
        // TODO kill bundles
        if (environment.bundle_url) {
          const baseURL = new URL(extractUrlBase(environment.bundle_url), window.location.href);

          environmentThumbnail = {
            srcset: resolveURL(thumbnailImage.srcset, baseURL)
          };
        } else {
          environmentThumbnail = {
            srcset: thumbnailImage.srcset
          };
        }
      }
    }

    return environmentThumbnail;
  };

  createHub = async e => {
    if (e) {
      e.preventDefault();
    }

    const environment = this.props.environments[this.state.environmentIndex];

    const payload = {
      hub: { name: this.state.name }
    };

    if (!this.state.customSceneUrl && environment.scene_id) {
      payload.hub.scene_id = environment.scene_id;
    } else {
      const sceneUrl = this.state.customSceneUrl || environment.bundle_url;
      payload.hub.default_environment_gltf_bundle_url = sceneUrl;
    }

    const createUrl = getReticulumFetchUrl("/api/v1/hubs");

    const res = await fetch(createUrl, {
      body: JSON.stringify(payload),
      headers: { "content-type": "application/json" },
      method: "POST"
    });

    const hub = await res.json();

    if (!process.env.RETICULUM_SERVER || document.location.host === process.env.RETICULUM_SERVER) {
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

  showCustomSceneDialog = e => {
    e.preventDefault();
    e.stopPropagation();
    this.setState({ showCustomSceneDialog: true });
  };

  shuffle = () => {
    this.setState({
      name: generateHubName(),
      environmentIndex: Math.floor(Math.random() * this.props.environments.length)
    });
  };

  render() {
    if (!this.state.ready) return null;

    if (this.props.environments.length == 0) {
      return <div />;
    }

    const environment = this.props.environments[this.state.environmentIndex];
    const meta = environment.meta || {};

    const environmentTitle = meta.title || environment.name;
    const environmentAuthor = (meta.authors || [])[0];
    const environmentThumbnail = this._getEnvironmentThumbnail(this.state.environmentIndex);

    return (
      <div>
        <form onSubmit={this.createHub}>
          <div className={styles.createPanel}>
            <div className={styles.form}>
              <div className={styles.environment}>
                <div className={styles.picker}>
                  <img className={styles.image} srcSet={environmentThumbnail.srcset} />
                  <div className={styles.labels}>
                    <div className={styles.header}>
                      {meta.url ? (
                        <a href={meta.url} rel="noopener noreferrer" className={styles.title}>
                          {environmentTitle}
                        </a>
                      ) : (
                        <span className={styles.title}>{environmentTitle}</span>
                      )}
                      {environmentAuthor &&
                        environmentAuthor.name &&
                        (environmentAuthor.url ? (
                          <a href={environmentAuthor.url} rel="noopener noreferrer" className={styles.author}>
                            <FormattedMessage id="home.environment_author_by" />
                            <span>{environmentAuthor.name}</span>
                          </a>
                        ) : (
                          <span className={styles.author}>
                            <FormattedMessage id="home.environment_author_by" />
                            <span>{environmentAuthor.name}</span>
                          </span>
                        ))}
                      {environmentAuthor &&
                        environmentAuthor.organization &&
                        (environmentAuthor.organization.url ? (
                          <a href={environmentAuthor.organization.url} rel="noopener noreferrer" className={styles.org}>
                            <span>{environmentAuthor.organization.name}</span>
                          </a>
                        ) : (
                          <span className={styles.org}>
                            <span>{environmentAuthor.organization.name}</span>
                          </span>
                        ))}
                    </div>
                    <div className={styles.footer}>
                      <button onClick={this.showCustomSceneDialog} className={styles.customButton}>
                        <FormattedMessage id="home.room_create_options" />
                      </button>
                    </div>
                  </div>
                  <div className={styles.controls}>
                    <button className={styles.prev} type="button" tabIndex="1" onClick={this.setToPreviousEnvironment}>
                      <FontAwesomeIcon icon={faAngleLeft} />
                    </button>

                    <button className={styles.next} type="button" tabIndex="2" onClick={this.setToNextEnvironment}>
                      <FontAwesomeIcon icon={faAngleRight} />
                    </button>
                  </div>
                </div>
              </div>
              <div className={styles.container}>
                <button type="submit" tabIndex="5" className={styles.submitButton}>
                  <FormattedMessage id="home.room_create_button" />
                </button>
              </div>
              <div className={styles.linkCode}>
                <div>
                  <a className={styles.link} href="/link" rel="nofollow">
                    <FormattedMessage id="home.have_entry_code" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </form>
        {this.state.showCustomSceneDialog && (
          <CreateRoomDialog
            onClose={() => this.setState({ showCustomSceneDialog: false })}
            onCustomScene={(name, url) => {
              this.setState({ showCustomSceneDialog: false, name: name, customSceneUrl: url }, () => this.createHub());
            }}
          />
        )}
      </div>
    );
  }
}

export default injectIntl(HubCreatePanel);
