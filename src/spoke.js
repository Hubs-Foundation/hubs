import ReactDOM from "react-dom";
import React, { Component } from "react";
//import PropTypes from "prop-types";
//import classNames from "classnames";
import { playVideoWithStopOnBlur } from "./utils/video-utils.js";
import { IntlProvider, FormattedMessage, addLocaleData } from "react-intl";
import styles from "./assets/stylesheets/spoke.scss";
import spokeLogo from "./assets/images/spoke_logo.png";
import spokeVideoMp4 from "./assets/video/spoke.mp4";
import spokeVideoWebm from "./assets/video/spoke.webm";
import YouTube from "react-youtube";

//const qs = new URLSearchParams(location.search);

import registerTelemetry from "./telemetry";

registerTelemetry();

import en from "react-intl/locale-data/en";
import { lang, messages } from "./utils/i18n";

addLocaleData([...en]);

function getPlatform() {
  const platform = window.navigator.platform;

  if (["Macintosh", "MacIntel", "MacPPC", "Mac68K"].indexOf(platform) >= 0) {
    return "macos";
  } else if (["Win32", "Win64", "Windows"].indexOf(platform) >= 0) {
    return "win";
  } else if (/Linux/.test(platform) && !/\WAndroid\W/.test(navigator.userAgent)) {
    return "linux";
  }

  return "unsupported";
}

class SpokeLanding extends Component {
  static propTypes = {};

  constructor(props) {
    super(props);
    this.state = {
      platform: getPlatform(),
      downloadClicked: false,
      downloadLinkForCurrentPlatform: {},
      showPlayer: false,
      playerVideoId: "WmQKZJPhV7s"
    };
  }

  componentDidMount() {
    this.loadVideo();
    this.fetchReleases();
  }

  tryGetJson = async request => {
    const text = await request.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      console.log(`JSON error parsing response from ${request.url} "${text}"`, e);
    }
  };

  getDownloadUrlForPlatform = (assets, platform) => {
    return assets.find(asset => asset.name.includes(platform)).downloadUrl;
  };

  fetchReleases = async () => {
    // Read-only, public access token.
    const token = "de8cbfb4cc0281c7b731c891df431016c29b0ace";
    const result = await fetch("https://api.github.com/graphql", {
      timeout: 5000,
      method: "POST",
      headers: { authorization: `bearer ${token}` },
      body: JSON.stringify({
        query: `
          {
            repository(owner: "mozillareality", name: "spoke") {
              releases(
                orderBy: { field: CREATED_AT, direction: DESC },
                first: 5
              ) {
                nodes {
                  isPrerelease,
                  isDraft,
                  tag { name },
                  releaseAssets(last: 3) {
                    nodes { name, downloadUrl }
                  }
                },
                pageInfo { endCursor, hasNextPage }
              }
            }
          }
        `
      })
    }).then(this.tryGetJson);

    if (!result || !result.data) {
      this.setState({ platform: "unsupported" });
      return;
    }

    const releases = result.data.repository.releases;
    const release = releases.nodes.find(release => /*!release.isPrerelease && */ !release.isDraft);

    if (!release) {
      this.setState({ platform: "unsupported" });
      return;
    }

    this.setState({
      downloadLinkForCurrentPlatform: this.getDownloadUrlForPlatform(release.releaseAssets.nodes, this.state.platform),
      spokeVersion: release.tag.name
    });
  };

  loadVideo() {
    const videoEl = document.querySelector("#preview-video");
    playVideoWithStopOnBlur(videoEl);
  }

  render() {
    const platform = this.state.platform;
    const releasesLink = "https://github.com/MozillaReality/Spoke/releases/latest";
    const downloadLink = platform === "unsupported" ? releasesLink : this.state.downloadLinkForCurrentPlatform;

    return (
      <IntlProvider locale={lang} messages={messages}>
        <div className={styles.ui}>
          <div className={styles.header}>
            <div className={styles.headerLinks}>
              <a href="https://github.com/mozillareality/spoke" rel="noopener noreferrer">
                <FormattedMessage id="home.source_link" />
              </a>
              <a href="https://discord.gg/XzrGUY8" rel="noreferrer noopener">
                <FormattedMessage id="home.community_link" />
              </a>
              <a href="/" rel="noreferrer noopener">
                Hubs
              </a>
            </div>
          </div>
          <div className={styles.content}>
            <div className={styles.heroPane}>
              <div className={styles.heroMessage}>
                <div className={styles.spokeLogo}>
                  <img src={spokeLogo} />
                  <div className={styles.primaryTagline}>
                    <FormattedMessage id="spoke.primary_tagline" />
                  </div>
                </div>
                <div className={styles.secondaryTagline}>
                  <FormattedMessage id="spoke.secondary_tagline" />
                  <a style={{ fontWeight: "bold" }} href="/">
                    Hubs
                  </a>
                </div>
                <div className={styles.actionButtons}>
                  {!this.state.downloadClicked ? (
                    <a
                      href={downloadLink}
                      onClick={() => this.setState({ downloadClicked: platform !== "unsupported" })}
                      className={styles.downloadButton}
                    >
                      <div>
                        <FormattedMessage id={"spoke.download_" + this.state.platform} />
                      </div>
                      {platform !== "unsupported" && (
                        <div className={styles.version}>{this.state.spokeVersion} Beta</div>
                      )}
                    </a>
                  ) : (
                    <div className={styles.thankYou}>
                      <p>
                        <FormattedMessage id="spoke.thank_you" />
                      </p>

                      <p>
                        You can also <a href="https://discord.gg/XzrGUY8/">join our community</a> on Discord.
                      </p>
                    </div>
                  )}

                  {platform !== "unsupported" &&
                    !this.state.downloadClicked && (
                      <a href={releasesLink} className={styles.browseVersions}>
                        <FormattedMessage id="spoke.browse_all_versions" />
                      </a>
                    )}
                  <div className={styles.tutorialButtons}>
                    <button
                      className={styles.playButton}
                      onClick={() => this.setState({ showPlayer: true, playerVideoId: "WmQKZJPhV7s" })}
                    >
                      <FormattedMessage id="spoke.beginner_tutorial_button" />
                    </button>
                    <button
                      className={styles.playButton}
                      onClick={() => this.setState({ showPlayer: true, playerVideoId: "1Yg5x4Plz_4" })}
                    >
                      <FormattedMessage id="spoke.advanced_tutorial_button" />
                    </button>
                  </div>
                </div>
              </div>
              <div className={styles.heroVideo}>
                <video playsInline muted loop autoPlay className={styles.previewVideo} id="preview-video">
                  <source src={spokeVideoMp4} type="video/mp4" />
                  <source src={spokeVideoWebm} type="video/webm" />
                </video>
                <div className={styles.attribution}>Low Poly Campfire by Minzkraut</div>
              </div>
            </div>
          </div>
          <div className={styles.bg} />
          {this.state.showPlayer && (
            <div className={styles.playerOverlay}>
              <div className={styles.playerContent}>
                <YouTube
                  className={styles.playerVideo}
                  opts={{ rel: 0 }}
                  videoId={this.state.playerVideoId}
                  onReady={e => e.target.playVideo()}
                />
                {platform !== "unsupported" && (
                  <a href={downloadLink} className={styles.downloadButton}>
                    <div>
                      <FormattedMessage id={"spoke.download_" + this.state.platform} />
                    </div>
                    <div className={styles.version}>{this.state.spokeVersion} Beta</div>
                  </a>
                )}
                <a onClick={() => this.setState({ showPlayer: false })} className={styles.closeVideo}>
                  <FormattedMessage id="spoke.close" />
                </a>
              </div>
            </div>
          )}
        </div>
      </IntlProvider>
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  ReactDOM.render(<SpokeLanding />, document.getElementById("ui-root"));
});
