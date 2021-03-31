import ReactDOM from "react-dom";
import React, { Component } from "react";
import "./utils/configs";
import { FormattedMessage } from "react-intl";
import { WrappedIntlProvider } from "./react-components/wrapped-intl-provider";
import "./react-components/styles/global.scss";
import styles from "./assets/stylesheets/discord.scss";
import discordBotLogo from "./assets/images/discord-bot-logo.png";
import discordBotVideoMP4 from "./assets/video/discord.mp4";
import discordBotVideoWebM from "./assets/video/discord.webm";
import Store from "./storage/store";

import registerTelemetry from "./telemetry";
import { ThemeProvider } from "./react-components/styles/theme";

registerTelemetry("/discord", "Discord Landing Page");

const inviteUrl = "https://forms.gle/GGPgarSuY5WaTNCT8";

const store = new Store();

class DiscordPage extends Component {
  componentDidMount() {}

  render() {
    return (
      <WrappedIntlProvider>
        <ThemeProvider store={store}>
          <div className={styles.ui}>
            <div className={styles.header}>
              <div className={styles.headerLinks}>
                <a href="/" rel="noreferrer noopener">
                  <FormattedMessage id="discord-page.hubs-cta" defaultMessage="Try Hubs" />
                </a>
                <a href="https://discord.gg/dFJncWwHun" rel="noreferrer noopener">
                  <FormattedMessage id="discord-page.community-link" defaultMessage="Hubs Discord" />
                </a>
              </div>
            </div>
            <div className={styles.content}>
              <div className={styles.heroPane}>
                <div className={styles.heroMessage}>
                  <div className={styles.discordLogo}>
                    <img src={discordBotLogo} />
                  </div>
                  <div className={styles.primaryTagline}>
                    <FormattedMessage
                      id="discord-page.primary-tagline"
                      defaultMessage="Share a virtual room with your community.{linebreak}Watch videos, play with 3D objects, or just hang out."
                      values={{ linebreak: <br /> }}
                    />
                  </div>
                  <div className={styles.secondaryTagline}>
                    <FormattedMessage
                      id="discord-page.secondary-tagline"
                      defaultMessage="No downloads or sign up. Full VR support too."
                    />
                  </div>
                  <div className={styles.actionButtons}>
                    <a href={inviteUrl} className={styles.downloadButton}>
                      <div>
                        <FormattedMessage id="discord-page.invite-button" defaultMessage="Invite Bot to Server" />
                      </div>
                    </a>
                  </div>
                </div>
                <div className={styles.heroSplash}>
                  <video playsInline loop autoPlay muted>
                    <source src={discordBotVideoMP4} type="video/mp4" />
                    <source src={discordBotVideoWebM} type="video/webm" />
                  </video>
                  <div className={styles.splashTagline}>
                    <FormattedMessage id="discord-page.splash-tag" defaultMessage="Designed for serious businessing." />
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.bg} />
          </div>
        </ThemeProvider>
      </WrappedIntlProvider>
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  ReactDOM.render(<DiscordPage />, document.getElementById("ui-root"));
});
