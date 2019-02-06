import React, { Component } from "react";
import PropTypes from "prop-types";
import { IntlProvider, FormattedMessage, addLocaleData } from "react-intl";
import en from "react-intl/locale-data/en";

import { lang, messages } from "../utils/i18n";
import { playVideoWithStopOnBlur } from "../utils/video-utils.js";
import homeVideoWebM from "../assets/video/home.webm";
import homeVideoMp4 from "../assets/video/home.mp4";
import hubLogo from "../assets/images/hub-preview-light-no-shadow.png";
import mozLogo from "../assets/images/moz-logo-black.png";
import classNames from "classnames";
import { ENVIRONMENT_URLS } from "../assets/environments/environments";
import { createAndRedirectToNewHub, connectToReticulum } from "../utils/phoenix-utils";
import maskEmail from "../utils/mask-email";
import qsTruthy from "../utils/qs_truthy";

import styles from "../assets/stylesheets/index.scss";

import HubCreatePanel from "./hub-create-panel.js";
import AuthDialog from "./auth-dialog.js";
import JoinUsDialog from "./join-us-dialog.js";
import ReportDialog from "./report-dialog.js";
import SignInDialog from "./sign-in-dialog.js";
import UpdatesDialog from "./updates-dialog.js";
import DialogContainer from "./dialog-container.js";
import { WithHoverSound } from "./wrap-with-audio";

addLocaleData([...en]);

class HomeRoot extends Component {
  static propTypes = {
    intl: PropTypes.object,
    sceneId: PropTypes.string,
    store: PropTypes.object,
    authChannel: PropTypes.object,
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
    signedIn: null,
    mailingListEmail: "",
    mailingListPrivacy: false
  };

  constructor(props) {
    super(props);
    this.state.signedIn = props.authChannel.signedIn;
    this.state.email = props.authChannel.email;
  }

  componentDidMount() {
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

  showDialog = (DialogClass, props = {}) => {
    this.setState({
      dialog: <DialogClass {...{ onClose: this.closeDialog, ...props }} />
    });
  };

  showAuthDialog = verifying => {
    this.showDialog(AuthDialog, { closable: false, verifying, authOrigin: this.props.authOrigin });
  };

  loadHomeVideo = () => {
    const videoEl = document.querySelector("#background-video");
    if (!videoEl) return;
    videoEl.playbackRate = 0.9;
    playVideoWithStopOnBlur(videoEl);
  };

  closeDialog = () => {
    this.setState({ dialog: null });
  };

  showJoinUsDialog = () => this.showDialog(JoinUsDialog);

  showReportDialog = () => this.showDialog(ReportDialog);

  showUpdatesDialog = () =>
    this.showDialog(UpdatesDialog, {
      onSubmittedEmail: () => {
        this.showDialog(
          <DialogContainer>Great! Please check your e-mail to confirm your subscription.</DialogContainer>
        );
      }
    });

  showSignInDialog = () => {
    this.showDialog(SignInDialog, {
      message: messages["sign-in.prompt"],
      onSignIn: async email => {
        const { authComplete } = await this.props.authChannel.startAuthentication(email);
        this.showDialog(SignInDialog, { authStarted: true });
        await authComplete;
        this.setState({ signedIn: true, email });
        this.closeDialog();
      }
    });
  };

  signOut = () => {
    this.props.authChannel.signOut();
    this.setState({ signedIn: false });
  };

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

  onLinkClicked = trigger => {
    return e => {
      e.preventDefault();
      e.stopPropagation();
      trigger();
    };
  };

  launchTour = () => {
    createAndRedirectToNewHub(
      "Hubs Tour",
      // TODO BP placeholder tour scene
      // "chjVRLh", // dev
      "d2SF68V", // prod
      null,
      false
    );
  };

  showCreateDialog = () => {
    this.showDialog(
      props => (
        <DialogContainer title="Choose a Scene" {...props}>
          <HubCreatePanel {...props} />
        </DialogContainer>
      ),
      {
        initialEnvironment: this.props.initialEnvironment,
        environments: this.state.environments
      }
    );
  };

  render() {
    const mainContentClassNames = classNames({
      [styles.mainContent]: true,
      [styles.noninteractive]: !!this.state.dialog
    });

    const useOculusBrowserFTUE = /Oculus/.test(navigator.userAgent) && qsTruthy("enable_ftue");
    const showFTUEVideo = false;

    return (
      <IntlProvider locale={lang} messages={messages}>
        <div className={styles.home}>
          <div className={mainContentClassNames}>
            {!useOculusBrowserFTUE && (
              <div className={styles.videoContainer}>
                <video playsInline muted loop autoPlay className={styles.backgroundVideo} id="background-video">
                  <source src={homeVideoWebM} type="video/webm" />
                  <source src={homeVideoMp4} type="video/mp4" />
                </video>
              </div>
            )}
            <div className={styles.headerContent}>
              <div className={styles.titleAndNav} onClick={() => (document.location = "/")}>
                <div className={styles.links}>
                  <WithHoverSound>
                    <a href="/whats-new">
                      <FormattedMessage id="home.whats_new_link" />
                    </a>
                  </WithHoverSound>
                  <WithHoverSound>
                    <a href="https://github.com/mozilla/hubs" rel="noreferrer noopener">
                      <FormattedMessage id="home.source_link" />
                    </a>
                  </WithHoverSound>
                  <WithHoverSound>
                    <a href="https://discord.gg/wHmY4nd" rel="noreferrer noopener">
                      <FormattedMessage id="home.community_link" />
                    </a>
                  </WithHoverSound>
                  <WithHoverSound>
                    <a href="/spoke" rel="noreferrer noopener">
                      Spoke
                    </a>
                  </WithHoverSound>
                </div>
              </div>
              <div className={styles.signIn}>
                {this.state.signedIn ? (
                  <div>
                    <span>
                      <FormattedMessage id="sign-in.as" /> {maskEmail(this.state.email)}
                    </span>{" "}
                    <a onClick={this.onLinkClicked(this.signOut)}>
                      <FormattedMessage id="sign-in.out" />
                    </a>
                  </div>
                ) : (
                  <a onClick={this.onLinkClicked(this.showSignInDialog)}>
                    <FormattedMessage id="sign-in.in" />
                  </a>
                )}
              </div>
            </div>
            <div
              className={classNames({ [styles.heroContent]: true, [styles.oculusBrowserHero]: useOculusBrowserFTUE })}
            >
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
              <div className={styles.heroPanel}>
                <div className={styles.container}>
                  <div className={styles.logo}>
                    <img src={hubLogo} />
                  </div>
                  <div className={styles.title}>
                    <FormattedMessage id="home.hero_title" />
                  </div>
                  {useOculusBrowserFTUE && (
                    <div className={styles.blurb}>
                      <FormattedMessage id="home.hero_blurb" />
                    </div>
                  )}
                  {!useOculusBrowserFTUE &&
                    this.state.environments.length === 0 && (
                      <div className="loader-wrap">
                        <div className="loader">
                          <div className="loader-center" />
                        </div>
                      </div>
                    )}
                </div>
                {useOculusBrowserFTUE ? (
                  <div className={styles.ctaButtons}>
                    <button
                      className={classNames(styles.primaryButton, styles.ctaButton)}
                      onClick={this.showCreateDialog}
                    >
                      <FormattedMessage id="home.create_a_room" />
                    </button>
                    <button className={classNames(styles.secondaryButton, styles.ctaButton)} onClick={this.launchTour}>
                      <FormattedMessage id="home.take_a_tour" />
                    </button>
                  </div>
                ) : (
                  <div className={styles.create}>
                    <HubCreatePanel
                      initialEnvironment={this.props.initialEnvironment}
                      environments={this.state.environments}
                    />
                  </div>
                )}
              </div>
              <div className={classNames(styles.heroPanel, styles.rightPanel)}>
                {useOculusBrowserFTUE &&
                  showFTUEVideo && (
                    <div className={styles.heroVideo}>
                      <video playsInline muted loop autoPlay>
                        <source src={homeVideoWebM} type="video/webm" />
                        <source src={homeVideoMp4} type="video/mp4" />
                      </video>
                    </div>
                  )}
                {(useOculusBrowserFTUE || this.state.environments.length > 1) && (
                  <div>
                    <WithHoverSound>
                      <div className={styles.haveCode}>
                        <a href="/link">
                          <FormattedMessage id="home.have_code" />
                        </a>
                      </div>
                    </WithHoverSound>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.footerContent}>
              <div className={styles.links}>
                <div className={styles.top}>
                  <WithHoverSound>
                    <a
                      className={styles.link}
                      rel="noopener noreferrer"
                      href="#"
                      onClick={this.onLinkClicked(this.showJoinUsDialog)}
                    >
                      <FormattedMessage id="home.join_us" />
                    </a>
                  </WithHoverSound>
                  <WithHoverSound>
                    <a
                      className={styles.link}
                      rel="noopener noreferrer"
                      href="#"
                      onClick={this.onLinkClicked(this.showUpdatesDialog)}
                    >
                      <FormattedMessage id="home.get_updates" />
                    </a>
                  </WithHoverSound>
                  <WithHoverSound>
                    <a
                      className={styles.link}
                      rel="noopener noreferrer"
                      href="#"
                      onClick={this.onLinkClicked(this.showReportDialog)}
                    >
                      <FormattedMessage id="home.report_issue" />
                    </a>
                  </WithHoverSound>
                  <WithHoverSound>
                    <a
                      className={styles.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      href="https://github.com/mozilla/hubs/blob/master/TERMS.md"
                    >
                      <FormattedMessage id="home.terms_of_use" />
                    </a>
                  </WithHoverSound>
                  <WithHoverSound>
                    <a
                      className={styles.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      href="https://github.com/mozilla/hubs/blob/master/PRIVACY.md"
                    >
                      <FormattedMessage id="home.privacy_notice" />
                    </a>
                  </WithHoverSound>

                  <img className={styles.mozLogo} src={mozLogo} />
                </div>
              </div>
            </div>
          </div>
          {this.state.dialog}
        </div>
      </IntlProvider>
    );
  }
}

export default HomeRoot;
