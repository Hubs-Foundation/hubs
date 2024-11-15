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
      <a target="_blank" rel="noopener noreferrer" href="https://hubsfoundation.org">
        <Twitter />
      </a>
      <a target="_blank" rel="noopener noreferrer" href="https://hubsfoundation.org">
        <Youtube />
      </a>
      <a target="_blank" rel="noopener noreferrer" href="https://hubsfoundation.org">
        <Twitch />
      </a>
      <a target="_blank" rel="noopener noreferrer" href="https://hubsfoundation.org">
        <Vimeo />
      </a>
    </Container>
  );
}
SocialBar.propTypes = {
  mobile: PropTypes.bool
};
