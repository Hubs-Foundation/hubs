import React, { Component, useRef } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { FormattedMessage, injectIntl } from "react-intl";
import configs from "../utils/configs";
import IfFeature from "./if-feature";
import styles from "../assets/stylesheets/scene-ui.scss";
import { createAndRedirectToNewHub, getReticulumFetchUrl } from "../utils/phoenix-utils";
import { ReactComponent as Twitter } from "./icons/Twitter.svg";
import { ReactComponent as CodeBranch } from "./icons/CodeBranch.svg";
import { ReactComponent as Pen } from "./icons/Pen.svg";
import { AppLogo } from "./misc/AppLogo";

import { useResizeViewport } from "./room/useResizeViewport";
function ResizeHookWrapper({ store, scene }) {
  const viewportRef = useRef(document.body);
  useResizeViewport(viewportRef, store, scene);
  return <></>;
}

class SceneUI extends Component {
  static propTypes = {
    intl: PropTypes.object,
    scene: PropTypes.object,
    store: PropTypes.object,
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
    showScreenshot: false
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
    createAndRedirectToNewHub(undefined, this.props.sceneId);
  };

  render() {
    if (this.props.unavailable) {
      return (
        <div className={styles.ui}>
          <div className={styles.unavailable}>
            <div>
              <FormattedMessage id="scene-page.unavailable" defaultMessage="This scene is no longer available." />
            </div>
          </div>
        </div>
      );
    }

    const { sceneAllowRemixing, isOwner, sceneProjectId, parentScene, sceneId, intl } = this.props;
    const sceneUrl = [location.protocol, "//", location.host, location.pathname].join("");
    const tweetText = intl.formatMessage(
      {
        id: "scene-page.default-tweet",
        defaultMessage: "{sceneName} in {shareHashtag}"
      },
      {
        sceneName: this.props.sceneName,
        shareHashtag: configs.translation("share-hashtag")
      }
    );
    const tweetLink = `https://twitter.com/share?url=${encodeURIComponent(sceneUrl)}&text=${encodeURIComponent(
      tweetText
    )}`;

    const unknown = intl.formatMessage({ id: "scene-page.unknown", defaultMessage: "unknown" });

    let attributions;

    const toAttributionSpan = ({ title, name, url, author, remix }) => {
      let source = "";

      if (!author && !url) {
        return null;
      }

      const _name = name || title || unknown;
      const _author = author || unknown;

      source = url && url.includes("sketchfab.com") ? "Sketchfab" : "";

      if (remix) {
        <span className="remix">
          <FormattedMessage
            id="scene-page.remix-attribution"
            defaultMessage="(Remixed from <a>{name} by {author}</a>)"
            values={{
              name: _name,
              author: _author,
              a: chunks =>
                url ? (
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    {chunks}
                  </a>
                ) : (
                  <>{chunks}</>
                )
            }}
          />
        </span>;
      } else if (source) {
        return (
          <span key={url}>
            <FormattedMessage
              id="scene-page.attribution-with-source"
              defaultMessage="<a>{name} by {author} on {source}</a>"
              values={{
                name: _name,
                author: _author,
                source,
                a: chunks =>
                  url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      {chunks}
                    </a>
                  ) : (
                    <>{chunks}</>
                  )
              }}
            />
          </span>
        );
      } else {
        return (
          <span key={`${_name} ${_author}`}>
            <FormattedMessage
              id="scene-page.attribution"
              defaultMessage="<a>{name} by {author}</a>"
              values={{
                name: _name,
                author: _author,
                a: chunks =>
                  url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      {chunks}
                    </a>
                  ) : (
                    <>{chunks}</>
                  )
              }}
            />
          </span>
        );
      }
    };

    if (this.props.sceneAttributions) {
      if (!this.props.sceneAttributions.extras) {
        attributions = (
          <span>
            <span>
              {this.props.sceneAttributions.creator ? (
                <FormattedMessage
                  id="scene-page.scene-attribution"
                  defaultMessage="by {creator}"
                  values={{ creator: this.props.sceneAttributions.creator || unknown }}
                />
              ) : (
                ""
              )}
            </span>
            {parentScene &&
              parentScene.attributions &&
              parentScene.attributions.creator &&
              toAttributionSpan({
                name: parentScene.name,
                url: parentScene.url,
                author: parentScene.attributions.creator,
                remix: true
              })}
            <br />
            <div className={styles.attribution}>
              {this.props.sceneAttributions.content && this.props.sceneAttributions.content.map(toAttributionSpan)}
            </div>
          </span>
        );
      } else {
        // Legacy
        attributions = <span>{this.props.sceneAttributions.extras}</span>;
      }
    }
    return (
      <div className={styles.ui}>
        <div
          className={classNames({
            [styles.screenshot]: true,
            [styles.screenshotHidden]: this.props.sceneLoaded
          })}
        >
          {this.state.showScreenshot && <img src={this.props.sceneScreenshotURL} />}
        </div>
        <div className={styles.grid}>
          <div className={styles.mainPanel}>
            <a href="/" className={styles.logo}>
              <AppLogo />
            </a>
            <div className={styles.logoTagline}>{configs.translation("app-tagline")}</div>
            <div className={styles.scenePreviewButtonWrapper}>
              {this.props.showCreateRoom && (
                <button className={styles.scenePreviewButton} onClick={this.createRoom}>
                  <FormattedMessage id="scene-page.create-button" defaultMessage="Create a room with this scene" />
                </button>
              )}
              <IfFeature name="enable_spoke">
                {isOwner && sceneProjectId ? (
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={getReticulumFetchUrl(`/spoke/projects/${sceneProjectId}`)}
                    className={styles.scenePreviewButton}
                  >
                    <Pen />
                    <FormattedMessage
                      id="scene-page.edit-button"
                      defaultMessage="Edit in {editorName}"
                      values={{ editorName: configs.translation("editor-name") }}
                    />
                  </a>
                ) : (
                  sceneAllowRemixing && (
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href={getReticulumFetchUrl(`/spoke/projects/new?sceneId=${sceneId}`)}
                      className={styles.scenePreviewButton}
                    >
                      <CodeBranch />
                      <FormattedMessage
                        id="scene-page.remix-button"
                        defaultMessage="Remix in {editorName}"
                        values={{ editorName: configs.translation("editor-name") }}
                      />
                    </a>
                  )
                )}
              </IfFeature>
              <a href={tweetLink} rel="noopener noreferrer" target="_blank" className={styles.scenePreviewButton}>
                <Twitter />
                <div>
                  <FormattedMessage id="scene-page.tweet-button" defaultMessage="Share on Twitter" />
                </div>
              </a>
            </div>
          </div>
          <div className={styles.info}>
            <div className={styles.name}>{this.props.sceneName}</div>
            <div className={styles.attribution}>{attributions}</div>
          </div>
        </div>
        <ResizeHookWrapper store={this.props.store} scene={this.props.scene} />
      </div>
    );
  }
}

export default injectIntl(SceneUI);
