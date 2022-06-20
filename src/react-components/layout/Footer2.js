import React from "react";
import PropTypes from "prop-types";
// import { FormattedMessage } from "react-intl";
import styles from "./Footer.scss";
// import discordLogoUrl from "../../assets/images/discord-logo-small.png";
import footerSVG from "../../assets/images/footer.svg";

import { Container } from "./Container";

export function Footer({
}) {
  return (
  
      <Container>
      <img src={footerSVG} style={{width: "100vw" , height: "300px"}} alt="xx" />
      </Container>

  );
}

Footer.propTypes = {
  hidePoweredBy: PropTypes.bool,
  showWhatsNewLink: PropTypes.bool,
  showTerms: PropTypes.bool,
  termsUrl: PropTypes.string,
  showPrivacy: PropTypes.bool,
  privacyUrl: PropTypes.string,
  showCompanyLogo: PropTypes.bool,
  companyLogoUrl: PropTypes.string,
  showDiscordBotLink: PropTypes.bool,
  appName: PropTypes.string,
  isHmc: PropTypes.bool
};
