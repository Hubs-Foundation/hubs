import React, { Component } from "react";
import PropTypes from "prop-types";
import { FormattedMessage, addLocaleData } from "react-intl";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import en from "react-intl/locale-data/en";

import configs from "../utils/configs";
import IfFeature from "./if-feature";
import { messages } from "../utils/i18n";
import { playVideoWithStopOnBlur } from "../utils/video-utils.js";
import homeVideoWebM from "../assets/video/home.webm";
import homeVideoMp4 from "../assets/video/home.mp4";
import discordLogoSmall from "../assets/images/discord-logo-small.png";
import classNames from "classnames";
import { isLocalClient, createAndRedirectToNewHub, connectToReticulum } from "../utils/phoenix-utils";
import checkIsMobile from "../utils/is-mobile";
import { faPlus } from "@fortawesome/free-solid-svg-icons/faPlus";
import mediaBrowserStyles from "../assets/stylesheets/media-browser.scss";
import AuthChannel from "../utils/auth-channel";
import RoomInfoDialog from "./room-info-dialog.js";
import { Page } from "./layout/Page";

import styles from "../assets/stylesheets/index.scss";

import AuthDialog from "./auth-dialog.js";
import SignInDialog from "./sign-in-dialog.js";
import MediaTiles from "./media-tiles";

addLocaleData([...en]);

const isMobile = checkIsMobile();

function installPWA() {
  () => {
    
}

function PWAButton({ pwaInstalled, onInstallPWA }) {
  use
  return (
    
  );
}

function CreateRoomButton() {
  <button
    className={classNames(styles.primaryButton, styles.ctaButton)}
    onClick={e => {
      e.preventDefault();
      createAndRedirectToNewHub(null, null, false);
    }}
  >
    <FormattedMessage id="home.create_a_room" />
  </button>;
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
    showCreate: PropTypes.bool,
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
    const showFTUEVideo = false;

    return (
      <Page
        showAdmin={this.props.showAdmin}
        signedIn={this.state.signedIn}
        email={this.state.email}
        onSignIn={this.onLinkClicked(this.showSignInDialog)}
        onSignOut={this.onLinkClicked(this.signOut)}
      >
        <div className={styles.heroContent} style={{ backgroundImage: configs.image("home_background", true) }}>
          {!this.props.hideHero &&
            (this.props.featuredRooms && this.props.featuredRooms.length > 0 ? (
              <>
                <div className={styles.heroPanel} key={1}>
                  <div className={styles.container}>
                    <div className={classNames([styles.logo, styles.logoMargin])}>
                      <img src={configs.image("logo")} />
                    </div>
                  </div>
                  <div className={styles.ctaButtons}>
                    {this.props.showCreate && this.renderCreateButton()}
                    {this.renderPwaButton()}
                  </div>
                </div>,
                <div className={styles.heroPanel} key={2}>
                  <div className={classNames([mediaBrowserStyles.mediaBrowser, mediaBrowserStyles.mediaBrowserInline])}>
                    <div className={classNames([mediaBrowserStyles.box, mediaBrowserStyles.darkened])}>
                      <MediaTiles
                        entries={this.props.featuredRooms}
                        handleEntryInfoClicked={this.showRoomInfo}
                        urlSource="favorites"
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className={styles.heroPanel}>
                <div className={styles.container}>
                  <div className={styles.logo}>
                    <img src={configs.image("logo")} />
                  </div>
                  <div className={styles.blurb}>
                    <FormattedMessage id="app-description" />
                  </div>
                </div>
                <div className={styles.ctaButtons}>
                  {this.props.showCreate && this.renderCreateButton()}
                  {this.renderPwaButton()}
                </div>
              </div>
            ))}
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

                <IfFeature name="show_discord_bot_link">
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
                </IfFeature>
              </div>
            </div>
          )}
        </div>
      </Page>
    );
  }
}

export default HomeRoot;
