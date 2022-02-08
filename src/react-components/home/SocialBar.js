import React from "react";
import PropTypes from "prop-types";
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
      <a target="_blank" rel="noopener noreferrer" href="https://discord.com/invite/dFJncWwHun">
        <Discord />
      </a>
      <a target="_blank" rel="noopener noreferrer" href="https://twitter.com/MozillaHubs">
        <Twitter />
      </a>
      <a target="_blank" rel="noopener noreferrer" href="https://www.youtube.com/c/MozillaHubs">
        <Youtube />
      </a>
      <a target="_blank" rel="noopener noreferrer" href="https://www.twitch.tv/mozillahubs">
        <Twitch />
      </a>
      <a target="_blank" rel="noopener noreferrer" href="https://vimeo.com/mozillahubs">
        <Vimeo />
      </a>
    </Container>
  );
}
SocialBar.propTypes = {
  mobile: PropTypes.bool
};
