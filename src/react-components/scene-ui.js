import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { FormattedMessage } from "react-intl";
import { WrappedIntlProvider } from "./wrapped-intl-provider";
import configs from "../utils/configs";
import IfFeature from "./if-feature";
import styles from "../assets/stylesheets/scene-ui.scss";
import { createAndRedirectToNewHub, getReticulumFetchUrl } from "../utils/phoenix-utils";
import CreateRoomDialog from "./create-room-dialog.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisH } from "@fortawesome/free-solid-svg-icons/faEllipsisH";
import { faCodeBranch } from "@fortawesome/free-solid-svg-icons/faCodeBranch";
import { faPencilAlt } from "@fortawesome/free-solid-svg-icons/faPencilAlt";

import { getMessages } from "../utils/i18n";

class SceneUI extends Component {
  static propTypes = {
    scene: PropTypes.object,
    sceneLoaded: PropTypes.bool,
    sceneId: PropTypes.string,
    sceneName: PropTypes.string,
    sceneDescription: PropTypes.string,
    sceneAttributions: PropTypes.object,
    sceneScreenshotURL: PropTypes.string,
    sceneProjectId: PropTypes.string,
    sceneAllowRemixing: PropTypes.bool,
    showCreateRoom: PropTypes.bool,
    unavailable: PropTypes.bool,
    isOwner: PropTypes.bool,
    parentScene: PropTypes.object
  };

  state = {
    showScreenshot: false,
    showCustomRoomDialog: false
  };

  constructor(props) {
    super(props);

    // Show screenshot if scene isn't loaded in 5 seconds
    setTimeout(() => {
      if (!this.props.sceneLoaded) {
        this.setState({ showScreenshot: true });
      }
    }, 5000);
  }

  componentDidMount() {
    this.props.scene.addEventListener("loaded", this.onSceneLoaded);
  }

  componentWillUnmount() {
    this.props.scene.removeEventListener("loaded", this.onSceneLoaded);
  }

  createRoom = () => {
    createAndRedirectToNewHub(this.state.customRoomName, this.props.sceneId);
  };

  render() {
    if (this.props.unavailable) {
      return (
        <WrappedIntlProvider>
          <div className={styles.ui}>
            <div className={styles.unavailable}>
              <div>
                <FormattedMessage id="scene.unavailable" />
              </div>
            </div>
          </div>
        </WrappedIntlProvider>
      );
    }

    const { sceneAllowRemixing, isOwner, sceneProjectId, parentScene, sceneId } = this.props;

    const sceneUrl = [location.protocol, "//", location.host, location.pathname].join("");
    const tweetText = `${this.props.sceneName} in ${getMessages()["share-hashtag"]}`;
    const tweetLink = `https://twitter.com/share?url=${encodeURIComponent(sceneUrl)}&text=${encodeURIComponent(
      tweetText
    )}`;

    let attributions;

    const toAttributionSpan = a => {
      if (a.url) {
        const source = a.url.includes("sketchfab.com")
          ? "on Sketchfab"
          : a.url.includes("poly.google.com")
            ? "on Google Poly"
            : "";

        return (
          <span key={a.url}>
            <a href={a.url} target="_blank" rel="noopener noreferrer">
              {a.name} by {a.author} {source}
            </a>
            &nbsp;
          </span>
        );
      } else {
        return (
          <span key={`${a.name} ${a.author}`}>
            {a.name} by {a.author}
            &nbsp;
          </span>
        );
      }
    };

    if (this.props.sceneAttributions) {
      if (!this.props.sceneAttributions.extras) {
        attributions = (
          <span>
            <span>{this.props.sceneAttributions.creator ? `by ${this.props.sceneAttributions.creator}` : ""}</span>
            {parentScene &&
              parentScene.attributions &&
              parentScene.attributions.creator && (
                <span className="remix">
                  &nbsp;(Remixed from&nbsp;
                  {toAttributionSpan({
                    name: parentScene.name,
                    url: parentScene.url,
                    author: parentScene.attributions.creator
                  })}
                  )
                </span>
              )}
            <br />
            {this.props.sceneAttributions.content && this.props.sceneAttributions.content.map(toAttributionSpan)}
          </span>
        );
      } else {
        // Legacy
        attributions = <span>{this.props.sceneAttributions.extras}</span>;
      }
    }

    return (
      <WrappedIntlProvider>
        <div className={styles.ui}>
          <div
            className={classNames({
              [styles.screenshot]: true,
              [styles.screenshotHidden]: this.props.sceneLoaded
            })}
          >
            {this.state.showScreenshot && <img src={this.props.sceneScreenshotURL} />}
          </div>
          <div className={styles.whiteOverlay} />
          <div className={styles.grid}>
            <div className={styles.mainPanel}>
              <a href="/" className={styles.logo}>
                <img src={configs.image("logo")} />
              </a>
              <div className={styles.logoTagline}>
                <FormattedMessage id="app-tagline" />
              </div>
              {this.props.showCreateRoom && (
                <div className={styles.createButtons}>
                  <button className={styles.createButton} onClick={this.createRoom}>
                    <FormattedMessage id="scene.create_button" />
                  </button>
                  <button
                    className={styles.optionsButton}
                    onClick={() => this.setState({ showCustomRoomDialog: true })}
                  >
                    <FontAwesomeIcon icon={faEllipsisH} />
                  </button>
                </div>
              )}
              <IfFeature name="enable_spoke">
                {isOwner && sceneProjectId ? (
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={getReticulumFetchUrl(`/spoke/projects/${sceneProjectId}`)}
                    className={styles.spokeButton}
                  >
                    <FontAwesomeIcon icon={faPencilAlt} />
                    <FormattedMessage id="scene.edit_button" />
                  </a>
                ) : (
                  sceneAllowRemixing && (
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href={getReticulumFetchUrl(`/spoke/projects/new?sceneId=${sceneId}`)}
                      className={styles.spokeButton}
                    >
                      <FontAwesomeIcon icon={faCodeBranch} />
                      <FormattedMessage id="scene.remix_button" />
                    </a>
                  )
                )}
              </IfFeature>
              <a href={tweetLink} rel="noopener noreferrer" target="_blank" className={styles.tweetButton}>
                <img src="../assets/images/twitter.svg" />
                <div>
                  <FormattedMessage id="scene.tweet_button" />
                </div>
              </a>
            </div>
          </div>
          <div className={styles.info}>
            <div className={styles.name}>{this.props.sceneName}</div>
            <div className={styles.attribution}>{attributions}</div>
          </div>
          <IfFeature name="enable_spoke">
            <div className={styles.spoke}>
              <div className={styles.madeWith}>made with</div>
              <a href="/spoke">
                <img src={configs.image("editor_logo")} />
              </a>
            </div>
          </IfFeature>
          {this.state.showCustomRoomDialog && (
            <CreateRoomDialog
              includeScenePrompt={false}
              onClose={() => this.setState({ showCustomRoomDialog: false })}
              onCustomScene={name => {
                this.setState({ showCustomRoomDialog: false, customRoomName: name }, () => this.createRoom());
              }}
            />
          )}
        </div>
      </WrappedIntlProvider>
    );
  }
}

export default SceneUI;
