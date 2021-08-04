import React from "react";
import styles from "./SocialBar.scss";
import { Container } from "../layout/Container";
import { ReactComponent as Discord } from "../icons/SocialDiscord.svg";
import { ReactComponent as Twitch } from "../icons/SocialTwitch.svg";
import { ReactComponent as Twitter } from "../icons/SocialTwitter.svg";
import { ReactComponent as Vimeo } from "../icons/SocialVimeo.svg";
import { ReactComponent as Youtube } from "../icons/SocialYoutube.svg";
export function SocialBar({ mobile }) {
  return (
    <Container className={mobile ? styles.mobileSocialBar : styles.socialBarContainer}>
      <a target="_blank" href="https://discord.com/invite/dFJncWwHun">
        <Discord alt="go to Discord" />
      </a>
      <a target="_blank" href="https://twitter.com/MozillaHubs">
        <Twitter alt="go to Twitter" />
      </a>
      <a target="_blank" href="https://www.youtube.com/c/MozillaHubs">
        <Youtube alt="go to Youtube" />
      </a>
      <a target="_blank" href="https://www.twitch.tv/mozillahubs">
        <Twitch alt="go to Twitch" />
      </a>
      <a target="_blank" href="https://vimeo.com/mozillahubs">
        <Vimeo alt="go to Vimeo" />
      </a>
    </Container>
  );
}
