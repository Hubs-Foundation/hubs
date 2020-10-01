import ReactDOM from "react-dom";
import React, { Component } from "react";
import "./utils/configs";
import { FormattedMessage } from "react-intl";
import { WrappedIntlProvider } from "./react-components/wrapped-intl-provider";
import styles from "./assets/stylesheets/discord.scss";
import discordBotLogo from "./assets/images/discord-bot-logo.png";
import discordBotVideoMP4 from "./assets/video/discord.mp4";
import discordBotVideoWebM from "./assets/video/discord.webm";

import registerTelemetry from "./telemetry";

registerTelemetry("/discord", "Discord Landing Page");

const inviteUrl = "https://forms.gle/GGPgarSuY5WaTNCT8";

class DiscordLanding extends Component {
  componentDidMount() {}

  render() {
    return (
      <WrappedIntlProvider>
        <div className={styles.ui}>
          <div className={styles.header}>
            <div className={styles.headerLinks}>
              <a href="/" rel="noreferrer noopener">
                Try Hubs
              </a>
              <a href="https://discord.gg/wHmY4nd" rel="noreferrer noopener">
                <FormattedMessage id="discord.community_link" />
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
                  <FormattedMessage id="discord.primary_tagline" />
                </div>
                <div className={styles.secondaryTagline}>
                  <FormattedMessage id="discord.secondary_tagline" />
                </div>
                <div className={styles.actionButtons}>
                  <a href={inviteUrl} className={styles.downloadButton}>
                    <div>
                      <FormattedMessage id="discord.contact_us" />
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
                  <FormattedMessage id="discord.splash_tag" />
                </div>
              </div>
            </div>
          </div>
          <div className={styles.bg} />
        </div>
      </WrappedIntlProvider>
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  ReactDOM.render(<DiscordLanding />, document.getElementById("ui-root"));
});
