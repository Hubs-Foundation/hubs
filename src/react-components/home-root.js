import React, { Component } from "react";
import PropTypes from "prop-types";
import { IntlProvider, FormattedMessage, addLocaleData } from "react-intl";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import en from "react-intl/locale-data/en";

import configs from "../utils/configs";
import IfFeature from "./if-feature";
import { lang, messages } from "../utils/i18n";
import { playVideoWithStopOnBlur } from "../utils/video-utils.js";
import homeVideoWebM from "../assets/video/home.webm";
import homeVideoMp4 from "../assets/video/home.mp4";
import classNames from "classnames";
import { isLocalClient, connectToReticulum } from "../utils/phoenix-utils";
import maskEmail from "../utils/mask-email";
import checkIsMobile from "../utils/is-mobile";
import { faPlus } from "@fortawesome/free-solid-svg-icons/faPlus";
import { faCog } from "@fortawesome/free-solid-svg-icons/faCog";
import mediaBrowserStyles from "../assets/stylesheets/media-browser.scss";
import fonts from "../assets/fonts/stylesheet.css";

import splashWebm from "../assets/video/splash.webm";
import AuthChannel from "../utils/auth-channel";
import RoomInfoDialog from "./room-info-dialog.js";

import styles from "../assets/stylesheets/index.scss";

import aug20Image from "../assets/images/aug20.png";
import loginButton from "../assets/images/login-button.png";
import logoutButton from "../assets/images/logout-button.png";

import AuthDialog from "./auth-dialog.js";
import SignInDialog from "./sign-in-dialog.js";
import MediaTiles from "./media-tiles";

import getRoomMetadata from "../room-metadata";

addLocaleData([...en]);

const isMobile = checkIsMobile();

class HomeRoot extends Component {
  static propTypes = {
    intl: PropTypes.object,
    store: PropTypes.object,
    authChannel: PropTypes.object,
    authVerify: PropTypes.bool,
    authTopic: PropTypes.string,
    authToken: PropTypes.string,
    authPayload: PropTypes.string,
    authOrigin: PropTypes.string,
    installEvent: PropTypes.object,
    hideHero: PropTypes.bool,
    showAdmin: PropTypes.bool,
    featuredRooms: PropTypes.array,
    publicRoomsResult: PropTypes.object,
    showSignIn: PropTypes.bool,
    signInDestination: PropTypes.string,
    signInDestinationUrl: PropTypes.string,
    signInReason: PropTypes.string
  };

  state = {
    dialog: null,
    signedIn: null
  };

  constructor(props) {
    super(props);
    this.state.signedIn = props.authChannel.signedIn;
    this.state.email = props.authChannel.email;
  }

  componentDidMount() {
    if (this.props.authVerify) {
      this.showAuthDialog(true, false);

      this.verifyAuth().then(verified => {
        this.showAuthDialog(false, verified);
      });
      return;
    }
    if (this.props.showSignIn) {
      this.showSignInDialog(false);
    }
    this.loadHomeVideo();
  }

  async verifyAuth() {
    const authChannel = new AuthChannel(this.props.store);
    authChannel.setSocket(await connectToReticulum());

    try {
      await authChannel.verifyAuthentication(this.props.authTopic, this.props.authToken, this.props.authPayload);
      this.setState({ signedIn: true, email: this.props.store.state.credentials.email });
      return true;
    } catch (e) {
      // Error during verification, likely invalid/expired token
      console.warn(e);
      return false;
    }
  }

  showDialog = (DialogClass, props = {}) => {
    this.setState({
      dialog: <DialogClass {...{ onClose: this.closeDialog, ...props }} />
    });
  };

  showAuthDialog = (verifying, verified) => {
    this.showDialog(AuthDialog, { verifying, verified, authOrigin: this.props.authOrigin });
  };

  showRoomInfo = hubEntry => {
    this.showDialog(RoomInfoDialog, {
      hubName: hubEntry.name,
      hubDescription: hubEntry.description
    });
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

  showSignInDialog = (closable = true) => {
    let messageId = "sign-in.prompt";

    if (this.props.signInReason === "admin_no_permission") {
      messageId = "sign-in.admin-no-permission";
    } else if (this.props.signInDestination === "admin") {
      messageId = "sign-in.admin";
    } else if (this.props.signInDestination === "hub") {
      messageId = "sign-in.hub";
    }

    this.showDialog(SignInDialog, {
      message: messages[messageId],
      closable: closable,
      onSignIn: async email => {
        const { authComplete } = await this.props.authChannel.startAuthentication(email);
        this.showDialog(SignInDialog, { authStarted: true });
        await authComplete;
        this.setState({ signedIn: true, email });
        this.closeDialog();

        if (this.props.signInDestinationUrl) {
          document.location = this.props.signInDestinationUrl;
        } else if (this.props.signInDestination === "admin") {
          document.location = isLocalClient() ? "/admin.html" : "/admin";
        }
      }
    });
  };

  signOut = () => {
    this.props.authChannel.signOut();
    this.setState({ signedIn: false });
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
        <div
          className={styles.home}
          style={
            {
              /* backgroundImage: configs.image("home_bg", true) */
            }
          }
        >
          <div
            style={{
              position: "fixed",
              top: "0",
              right: "0",
              bottom: "0",
              left: "0",
              overflow: "hidden",
              zIndex: "-100"
            }}
          >
            <video
              playsInline
              loop
              autoPlay
              muted
              style={{
                position: "absolute",
                top: "0",
                left: "0",
                width: "100%",
                height: "100%",
                minWidth: "100vw",
                minHeight: "100vh",
                transform: "scale(1.2, 1.2)"
              }}
            >
              <source src={splashWebm} type="video/webm" />
            </video>
          </div>
          <div className={mainContentClassNames}>
            <div className={styles.heroContent}>{this.renderBody()}</div>
            <div className={styles.footerContent}>
              <div className={styles.links}>
                <div className={styles.top}>
                  <IfFeature name="show_join_us_dialog">
                    <a className={styles.link} rel="noopener noreferrer" href="/#/join-us">
                      <FormattedMessage id="home.join_us" />
                    </a>
                  </IfFeature>
                  <IfFeature name="show_issue_report_link">
                    {configs.feature("show_issue_report_dialog") ? (
                      <a className={styles.link} rel="noopener noreferrer" href="/#/report">
                        <FormattedMessage id="home.report_issue" />
                      </a>
                    ) : (
                      <a
                        className={styles.link}
                        href={configs.link("issue_report", "/#/report")}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        <FormattedMessage id="settings.report" />
                      </a>
                    )}
                  </IfFeature>
                  <IfFeature name="show_terms">
                    <a
                      className={styles.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      href={configs.link("terms_of_use", "https://github.com/mozilla/hubs/blob/master/TERMS.md")}
                    >
                      <FormattedMessage id="home.terms_of_use" />
                    </a>
                  </IfFeature>
                  <IfFeature name="show_privacy">
                    <a
                      className={styles.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      href={configs.link("privacy_notice", "https://github.com/mozilla/hubs/blob/master/PRIVACY.md")}
                    >
                      <FormattedMessage id="home.privacy_notice" />
                    </a>
                  </IfFeature>
                  <IfFeature name="show_company_logo">
                    <img className={styles.companyLogo} src={configs.image("company_logo")} />
                  </IfFeature>
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

  renderSignInInfo() {
    return (
      <div
        style={{
          fontFamily: "steps-monomono_thin",
          color: "#667000",
          textTransform: "lowercase",
          maxWidth: "240px",
          textAlign: "right",
          marginTop: "24px",
          marginRight: "20px"
        }}
      >
        <span>
          <FormattedMessage id="sign-in.as" /> {this.state.email}
        </span>{" "}
      </div>
    );
  }

  renderEnterButton() {
    // <a onClick={this.onLinkClicked(this.showSignInDialog)}></a>
    // <a onClick={this.onLinkClicked(this.signOut)}>

    return (
      <button
        style={{
          border: "none",
          background: "none",
          padding: "0",
          margin: "0"
        }}
        onClick={e => {
          e.preventDefault();
          const targetUrl = getRoomMetadata("lobby").url;
          if (targetUrl) {
            location.href = targetUrl;
          } else {
            console.error("invalid portal targetRoom:", this.data.targetRoom);
          }
        }}
      >
        <img
          style={{
            maxWidth: "120px"
          }}
          src={aug20Image}
        />
      </button>
    );
  }

  renderSignInDialog() {
    // <a onClick={}></a>
    // <a onClick={this.onLinkClicked(this.signOut)}>

    return (
      <button
        style={{
          border: "none",
          background: "none",
          padding: "0",
          margin: "0",
          cursor: "pointer"
        }}
        onClick={this.onLinkClicked(this.showSignInDialog)}
      >
        <img
          style={{
            maxWidth: "200px"
          }}
          src={loginButton}
        />
      </button>
    );
  }

  renderSignOutDialog() {
    // <a onClick={}></a>
    // <a onClick={this.onLinkClicked(this.signOut)}>

    return (
      <button
        style={{
          border: "none",
          background: "none",
          padding: "0",
          margin: "0",
          cursor: "pointer"
        }}
        onClick={this.onLinkClicked(this.signOut)}
      >
        <img
          style={{
            maxWidth: "200px",
            marginRight: "-25px"
          }}
          src={logoutButton}
        />
      </button>
    );
  }

  renderBody() {
    return (
      <div className={styles.heroPanel}>
        <div className={styles.container}>
          <img
            src={configs.image("home_logo")}
            style={{
              maxWidth: "400px",
              animation: "logo-rotate 4s linear infinite"
            }}
          />
          {this.renderEnterButton()}
        </div>
        <div className={styles.ctaButtons}>
          <div
            style={{
              position: "absolute",
              top: "32px",
              right: "16px",
              display: "flex",
              alignItems: "flex-end",
              flexDirection: "column"
            }}
          >
            {!this.state.signedIn && this.renderSignInDialog()}
            {this.state.signedIn && this.renderSignOutDialog()}
            {this.state.signedIn && this.renderSignInInfo()}
          </div>
        </div>
      </div>
    );
  }
}

export default HomeRoot;
