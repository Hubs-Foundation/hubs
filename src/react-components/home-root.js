import React, { Component } from "react";
import PropTypes from "prop-types";
import { IntlProvider, FormattedMessage, addLocaleData } from "react-intl";
import en from "react-intl/locale-data/en";

import { lang, messages } from "../utils/i18n";
import homeVideoWebM from "../assets/video/home.webm";
import homeVideoMp4 from "../assets/video/home.mp4";
import hubLogo from "../assets/images/hub-preview-white.png";
import mozLogo from "../assets/images/moz-logo-black.png";
import classNames from "classnames";
import { ENVIRONMENT_URLS } from "../assets/environments/environments";
import { connectToReticulum } from "../utils/phoenix-utils";

import styles from "../assets/stylesheets/index.scss";

import HubCreatePanel from "./hub-create-panel.js";
import AuthDialog from "./auth-dialog.js";
import ReportDialog from "./report-dialog.js";
import SlackDialog from "./slack-dialog.js";
import UpdatesDialog from "./updates-dialog.js";
import DialogContainer from "./dialog-container.js";

addLocaleData([...en]);

class HomeRoot extends Component {
  static propTypes = {
    intl: PropTypes.object,
    sceneId: PropTypes.string,
    authVerify: PropTypes.bool,
    authTopic: PropTypes.string,
    authToken: PropTypes.string,
    authOrigin: PropTypes.string,
    listSignup: PropTypes.bool,
    report: PropTypes.bool,
    initialEnvironment: PropTypes.string
  };

  state = {
    environments: [],
    dialog: null,
    mailingListEmail: "",
    mailingListPrivacy: false
  };

  componentDidMount() {
    this.closeDialog = this.closeDialog.bind(this);
    if (this.props.authVerify) {
      this.showAuthDialog(true);
      this.verifyAuth().then(this.showAuthDialog);
      return;
    }
    if (this.props.sceneId) {
      this.loadEnvironmentFromScene();
    } else {
      this.loadEnvironments();
    }
    this.loadHomeVideo();
    if (this.props.listSignup) {
      this.showUpdatesDialog();
    } else if (this.props.report) {
      this.showReportDialog();
    }
  }

  async verifyAuth() {
    const socket = connectToReticulum();
    const channel = socket.channel(this.props.authTopic);
    await new Promise((resolve, reject) =>
      channel
        .join()
        .receive("ok", resolve)
        .receive("error", reject)
    );
    channel.push("auth_verified", { token: this.props.authToken });
  }

  showAuthDialog = verifying => {
    this.setState({ dialog: <AuthDialog verifying={verifying} authOrigin={this.props.authOrigin} /> });
  };

  loadHomeVideo = () => {
    const videoEl = document.querySelector("#background-video");
    videoEl.playbackRate = 0.9;
    function toggleVideo() {
      // Play the video if the window/tab is visible.
      if (document.hasFocus()) {
        videoEl.play();
      } else {
        videoEl.pause();
      }
    }
    if ("hasFocus" in document) {
      document.addEventListener("visibilitychange", toggleVideo);
      window.addEventListener("focus", toggleVideo);
      window.addEventListener("blur", toggleVideo);
    }
  };

  closeDialog() {
    this.setState({ dialog: null });
  }

  showSlackDialog() {
    this.setState({ dialog: <SlackDialog onClose={this.closeDialog} /> });
  }

  showReportDialog() {
    this.setState({ dialog: <ReportDialog onClose={this.closeDialog} /> });
  }

  showUpdatesDialog() {
    this.setState({
      dialog: <UpdatesDialog onClose={this.closeDialog} onSubmittedEmail={() => this.showEmailSubmittedDialog()} />
    });
  }

  showEmailSubmittedDialog() {
    this.setState({
      dialog: (
        <DialogContainer onClose={this.closeDialog}>
          Great! Please check your e-mail to confirm your subscription.
        </DialogContainer>
      )
    });
  }

  loadEnvironmentFromScene = async () => {
    let sceneUrlBase = "/api/v1/scenes";
    if (process.env.RETICULUM_SERVER) {
      sceneUrlBase = `https://${process.env.RETICULUM_SERVER}${sceneUrlBase}`;
    }
    const sceneInfoUrl = `${sceneUrlBase}/${this.props.sceneId}`;
    const resp = await fetch(sceneInfoUrl).then(r => r.json());
    const scene = resp.scenes[0];
    const attribution = scene.attribution && scene.attribution.split("\n").join(", ");
    const authors = attribution && [{ organization: { name: attribution } }];
    // Transform the scene info into a an environment bundle structure.
    this.setState({
      environments: [
        {
          scene_id: this.props.sceneId,
          meta: {
            title: scene.name,
            authors,
            images: [{ type: "preview-thumbnail", srcset: scene.screenshot_url }]
          }
        }
      ]
    });
  };

  loadEnvironments = () => {
    const environments = [];

    const environmentLoads = ENVIRONMENT_URLS.map(src =>
      (async () => {
        const res = await fetch(src);
        const data = await res.json();
        data.bundle_url = src;
        environments.push(data);
      })()
    );

    Promise.all(environmentLoads).then(() => this.setState({ environments }));
  };

  onDialogLinkClicked = trigger => {
    return e => {
      e.preventDefault();
      e.stopPropagation();
      trigger();
    };
  };

  render() {
    const mainContentClassNames = classNames({
      [styles.mainContent]: true,
      [styles.noninteractive]: !!this.state.dialog
    });

    return (
      <IntlProvider locale={lang} messages={messages}>
        <div className={styles.home}>
          <div className={mainContentClassNames}>
            <div className={styles.headerContent}>
              <div className={styles.titleAndNav}>
                <div className={styles.links}>
                  <a
                    href="https://blog.mozvr.com/introducing-hubs-a-new-way-to-get-together-online/"
                    rel="noreferrer noopener"
                  >
                    <FormattedMessage id="home.about_link" />
                  </a>
                  <a href="https://github.com/mozilla/hubs" rel="noreferrer noopener">
                    <FormattedMessage id="home.source_link" />
                  </a>
                </div>
              </div>
              <div className={styles.ident} />
            </div>
            <div className={styles.heroContent}>
              <div className={styles.attribution}>
                Medieval Fantasy Book by{" "}
                <a
                  target="_blank"
                  rel="noreferrer noopener"
                  href="https://sketchfab.com/models/06d5a80a04fc4c5ab552759e9a97d91a?utm_campaign=06d5a80a04fc4c5ab552759e9a97d91a&utm_medium=embed&utm_source=oembed"
                >
                  Pixel
                </a>
              </div>
              <div className={styles.container}>
                <img className={styles.logo} src={hubLogo} />
                <div className={styles.title}>
                  <FormattedMessage id="home.hero_title" />
                </div>
              </div>
              <div className={styles.create}>
                <HubCreatePanel
                  initialEnvironment={this.props.initialEnvironment}
                  environments={this.state.environments}
                />
              </div>
              <div className={styles.joinButton}>
                <a href="/link">
                  <FormattedMessage id="home.join_room" />
                </a>
              </div>
            </div>
            <div className={styles.footerContent}>
              <div className={styles.links}>
                <div className={styles.top}>
                  <a
                    className={styles.link}
                    rel="noopener noreferrer"
                    href="#"
                    onClick={this.onDialogLinkClicked(this.showSlackDialog.bind(this))}
                  >
                    <FormattedMessage id="home.join_us" />
                  </a>
                  <a
                    className={styles.link}
                    rel="noopener noreferrer"
                    href="#"
                    onClick={this.onDialogLinkClicked(this.showUpdatesDialog.bind(this))}
                  >
                    <FormattedMessage id="home.get_updates" />
                  </a>
                  <a
                    className={styles.link}
                    rel="noopener noreferrer"
                    href="#"
                    onClick={this.onDialogLinkClicked(this.showReportDialog.bind(this))}
                  >
                    <FormattedMessage id="home.report_issue" />
                  </a>
                  <a
                    className={styles.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://github.com/mozilla/hubs/blob/master/TERMS.md"
                  >
                    <FormattedMessage id="home.terms_of_use" />
                  </a>
                  <a
                    className={styles.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://github.com/mozilla/hubs/blob/master/PRIVACY.md"
                  >
                    <FormattedMessage id="home.privacy_notice" />
                  </a>

                  <img className={styles.mozLogo} src={mozLogo} />
                </div>
              </div>
            </div>
          </div>
          <video playsInline muted loop autoPlay className={styles.backgroundVideo} id="background-video">
            <source src={homeVideoWebM} type="video/webm" />
            <source src={homeVideoMp4} type="video/mp4" />
          </video>
          {this.state.dialog}
        </div>
      </IntlProvider>
    );
  }
}

export default HomeRoot;
