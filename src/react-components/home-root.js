import React, { Component, useState } from "react";
import PropTypes from "prop-types";
import { IntlProvider, FormattedMessage, addLocaleData } from "react-intl";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import en from "react-intl/locale-data/en";
import queryString from "query-string";
import { lang, messages } from "../utils/i18n";
import { playVideoWithStopOnBlur } from "../utils/video-utils.js";
import classNames from "classnames";
import { isLocalClient, connectToReticulum } from "../utils/phoenix-utils";
import checkIsMobile from "../utils/is-mobile";
import { faPlus } from "@fortawesome/free-solid-svg-icons/faPlus";
import backgroundAudio from "../assets/gorloj-nagrume.mp3";
import splashWebm from "../assets/video/splash2.webm";
import splashMp4 from "../assets/video/splash2.mp4";
import AuthChannel from "../utils/auth-channel";
import RoomInfoDialog from "./room-info-dialog.js";

import styles from "../assets/stylesheets/index.scss";

import aug20Image from "../assets/images/aug22.gif";
import aug20ImageWebp from "../assets/images/aug22.webp";

// import loginButton from "../assets/images/login-button.png";
// import loginButtonWebp from "../assets/images/login-button.webp";
// import loginButtonHover from "../assets/images/login-button-hover.png";
// import loginButtonHoverWebp from "../assets/images/login-button-hover.webp";

import logoImage from "../assets/images/logo.png";
import logoImageWebp from "../assets/images/logo.webp";

// import enterButton from "../assets/images/enter-button.gif";
// import enterButtonHover from "../assets/images/enter-button-hover.gif";

// import logoutButton from "../assets/images/logout-button.png";
// import logoutButtonWebp from "../assets/images/logout-button.webp";

// import logoutButtonHover from "../assets/images/logout-button-hover.png";
// import logoutButtonHoverWebp from "../assets/images/logout-button-hover.webp";

import AuthDialog from "./auth-dialog.js";
import SignInDialog from "./sign-in-dialog.js";

import { getRoomMetadata } from "../room-metadata";

addLocaleData([...en]);

const isMobile = checkIsMobile();

const queryArgs = queryString.parse(window.location.search);
let showLogin = false;

if (queryArgs["login"]) {
  showLogin = true;
}

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
              <source src={splashMp4} type="video/mp4" />
              <source src={splashWebm} type="video/webm" />
            </video>
          </div>
          <div className={mainContentClassNames}>
            <div className={styles.heroContent}>{this.renderBody()}</div>
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

  renderAug20Button() {
    // <a onClick={this.onLinkClicked(this.showSignInDialog)}></a>
    // <a onClick={this.onLinkClicked(this.signOut)}>

    return (
      <picture>
        <source srcset={aug20ImageWebp} type="image/webp" />
        <source srcset={aug20Image} type="image/gif" />
        <img
          src={aug20ImageWebp}
          style={{
            maxWidth: "200px",
            mixBlendMode: "lighten"
          }}
        />
      </picture>
    );
  }

  renderSignInDialog() {
    // <a onClick={}></a>
    // <a onClick={this.onLinkClicked(this.signOut)}>

    return <LoginButton onLinkClicked={this.onLinkClicked(this.showSignInDialog)} />;
  }

  renderSignOutDialog() {
    // <a onClick={}></a>
    // <a onClick={this.onLinkClicked(this.signOut)}>

    return <LogoutButton onLinkClicked={this.onLinkClicked(this.signOut)} />;
  }

  renderBody() {
    return (
      <div className={styles.heroPanel}>
        <div className={styles.container}>
          <audio loop autoPlay>
            <source src={backgroundAudio} type="audio/mpeg" />
          </audio>
          <picture>
            <source srcSet={logoImageWebp} type="image/webp" />
            <img
              src={logoImage}
              style={{
                maxWidth: "750px",
                animation: "logo-rotate 5s linear infinite"
              }}
            />
          </picture>
          {!this.state.signedIn && this.renderAug20Button()}
          {this.state.signedIn && (
            <div
              style={{
                marginLeft: "225px" // half of maxWidth above
              }}
            >
              <EnterButton />
            </div>
          )}
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
            {!this.state.signedIn && showLogin && this.renderSignInDialog()}
            {this.state.signedIn && this.renderSignOutDialog()}
            {this.state.signedIn && this.renderSignInInfo()}
          </div>
        </div>
      </div>
    );
  }
}

export default HomeRoot;
