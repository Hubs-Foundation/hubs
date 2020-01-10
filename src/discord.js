import ReactDOM from "react-dom";
import React, { Component } from "react";
import "./utils/configs";
import { IntlProvider, FormattedMessage, addLocaleData } from "react-intl";
import styles from "./assets/stylesheets/discord.scss";
import discordBotLogo from "./assets/images/discord-bot-logo.png";
import discordBotVideoMP4 from "./assets/video/discord.mp4";
import discordBotVideoWebM from "./assets/video/discord.webm";

import registerTelemetry from "./telemetry";

registerTelemetry("/discord", "Discord Landing Page");

import en from "react-intl/locale-data/en";
import { lang, messages } from "./utils/i18n";

addLocaleData([...en]);
const inviteUrl = "https://forms.gle/GGPgarSuY5WaTNCT8";

class DiscordLanding extends Component {
  componentDidMount() {}

  render() {
    return (
      <IntlProvider locale={lang} messages={messages}>
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
      </IntlProvider>
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  ReactDOM.render(<DiscordLanding />, document.getElementById("ui-root"));
});
