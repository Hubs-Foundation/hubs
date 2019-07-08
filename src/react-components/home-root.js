import React, { Component } from "react";
import PropTypes from "prop-types";
import { IntlProvider, FormattedMessage, addLocaleData } from "react-intl";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import en from "react-intl/locale-data/en";

import { lang, messages } from "../utils/i18n";
import { playVideoWithStopOnBlur } from "../utils/video-utils.js";
import homeVideoWebM from "../assets/video/home.webm";
import homeVideoMp4 from "../assets/video/home.mp4";
import hubLogo from "../assets/images/hub-preview-light-no-shadow.png";
import discordLogoSmall from "../assets/images/discord-logo-small.png";
import mozLogo from "../assets/images/moz-logo-black.png";
import classNames from "classnames";
import { ENVIRONMENT_URLS } from "../assets/environments/environments";
import { createAndRedirectToNewHub, connectToReticulum } from "../utils/phoenix-utils";
import maskEmail from "../utils/mask-email";
import checkIsMobile from "../utils/is-mobile";
import { faPlus } from "@fortawesome/free-solid-svg-icons/faPlus";
import mediaBrowserStyles from "../assets/stylesheets/media-browser.scss";
import AuthChannel from "../utils/auth-channel";

import styles from "../assets/stylesheets/index.scss";

import AuthDialog from "./auth-dialog.js";
import JoinUsDialog from "./join-us-dialog.js";
import ReportDialog from "./report-dialog.js";
import SignInDialog from "./sign-in-dialog.js";
import UpdatesDialog from "./updates-dialog.js";
import DialogContainer from "./dialog-container.js";
import MediaTiles from "./media-tiles";

addLocaleData([...en]);

const isMobile = checkIsMobile();

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
    initialEnvironment: PropTypes.string,
    installEvent: PropTypes.object,
    hideHero: PropTypes.bool,
    favoriteHubsResult: PropTypes.object
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
    const authChannel = new AuthChannel(this.props.store);
    authChannel.setSocket(await connectToReticulum());
    await authChannel.verifyAuthentication(this.props.authTopic, this.props.authToken);
    this.setState({ signedIn: true, email: this.props.store.state.credentials.email });
  }

  showDialog = (DialogClass, props = {}) => {
    this.setState({
      dialog: <DialogClass {...{ onClose: this.closeDialog, ...props }} />
    });
  };

  showAuthDialog = verifying => {
    this.showDialog(AuthDialog, { verifying, authOrigin: this.props.authOrigin });
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

  render() {
    const mainContentClassNames = classNames({
      [styles.mainContent]: true,
      [styles.noninteractive]: !!this.state.dialog
    });

    const showFTUEVideo = false;

    return (
      <IntlProvider locale={lang} messages={messages}>
        <div className={styles.home}>
          <div className={mainContentClassNames}>
            <div className={styles.headerContent}>
              <div className={styles.titleAndNav} onClick={() => (document.location = "/")}>
                <div className={styles.links}>
                  <a href="/whats-new">
                    <FormattedMessage id="home.whats_new_link" />
                  </a>
                  <a href="https://github.com/mozilla/hubs" rel="noreferrer noopener">
                    <FormattedMessage id="home.source_link" />
                  </a>
                  <a href="https://discord.gg/wHmY4nd" rel="noreferrer noopener">
                    <FormattedMessage id="home.community_link" />
                  </a>
                  <a href="/spoke" rel="noreferrer noopener">
                    Spoke
                  </a>
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
            <div className={styles.heroContent}>
              {!this.props.hideHero &&
                (this.props.favoriteHubsResult &&
                this.props.favoriteHubsResult.entries.length > 0 &&
                this.state.signedIn
                  ? this.renderFavoriteHero()
                  : this.renderNonFavoriteHero())}
              {!this.props.hideHero && (
                <div className={classNames(styles.heroPanel, styles.rightPanel)}>
                  {showFTUEVideo && (
                    <div className={styles.heroVideo}>
                      <video playsInline muted loop autoPlay>
                        <source src={homeVideoWebM} type="video/webm" />
                        <source src={homeVideoMp4} type="video/mp4" />
                      </video>
                    </div>
                  )}
                  <div>
                    <div className={styles.secondaryLink}>
                      <a href="/link">
                        <FormattedMessage id="home.have_code" />
                      </a>
                    </div>

                    <div className={styles.secondaryLink}>
                      <div>
                        <FormattedMessage id="home.add_to_discord_1" />
                      </div>
                      <img src={discordLogoSmall} />
                      <a href="/discord">
                        <FormattedMessage id="home.add_to_discord_2" />
                      </a>
                      <div>
                        <FormattedMessage id="home.add_to_discord_3" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className={styles.footerContent}>
              <div className={styles.links}>
                <div className={styles.top}>
                  <a
                    className={styles.link}
                    rel="noopener noreferrer"
                    href="#"
                    onClick={this.onLinkClicked(this.showJoinUsDialog)}
                  >
                    <FormattedMessage id="home.join_us" />
                  </a>
                  <a
                    className={styles.link}
                    rel="noopener noreferrer"
                    href="#"
                    onClick={this.onLinkClicked(this.showUpdatesDialog)}
                  >
                    <FormattedMessage id="home.get_updates" />
                  </a>
                  <a
                    className={styles.link}
                    rel="noopener noreferrer"
                    href="#"
                    onClick={this.onLinkClicked(this.showReportDialog)}
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
          {this.state.dialog}
        </div>
      </IntlProvider>
    );
  }

  renderPwaButton() {
    return (
      <button
        className={classNames(styles.secondaryButton)}
        style={this.props.installEvent || this.state.installed ? {} : { visibility: "hidden" }}
        onClick={() => {
          this.props.installEvent.prompt();

          this.props.installEvent.userChoice.then(choiceResult => {
            if (choiceResult.outcome === "accepted") {
              this.setState({ installed: true });
            }
          });
        }}
      >
        <i>
          <FontAwesomeIcon icon={faPlus} />
        </i>
        <FormattedMessage id={`home.${isMobile ? "mobile" : "desktop"}.add_pwa`} />
      </button>
    );
  }

  renderCreateButton() {
    return (
      <button
        className={classNames(styles.primaryButton, styles.ctaButton)}
        onClick={e => {
          e.preventDefault();
          createAndRedirectToNewHub(null, process.env.DEFAULT_SCENE_SID, null, false);
        }}
      >
        <FormattedMessage id="home.create_a_room" />
      </button>
    );
  }

  renderFavoriteHero() {
    return [
      <div className={styles.heroPanel} key={1}>
        <div className={styles.container}>
          <div className={classNames([styles.logo, styles.logoMargin])}>
            <img src={hubLogo} />
          </div>
        </div>
        <div className={styles.ctaButtons}>
          {this.renderCreateButton()}
          {this.renderPwaButton()}
        </div>
      </div>,
      <div className={styles.heroPanel} key={2}>
        <div className={classNames([mediaBrowserStyles.mediaBrowser, mediaBrowserStyles.mediaBrowserInline])}>
          <div className={classNames([mediaBrowserStyles.box, mediaBrowserStyles.darkened])}>
            <MediaTiles result={this.props.favoriteHubsResult} urlSource="favorites" />
          </div>
        </div>
      </div>
    ];
  }

  renderNonFavoriteHero() {
    return (
      <div className={styles.heroPanel}>
        <div className={styles.container}>
          <div className={styles.logo}>
            <img src={hubLogo} />
          </div>
          <div className={styles.blurb}>
            <FormattedMessage id="home.hero_blurb" />
          </div>
        </div>
        <div className={styles.ctaButtons}>
          {this.renderCreateButton()}
          {this.renderPwaButton()}
        </div>
      </div>
    );
  }
}

export default HomeRoot;
