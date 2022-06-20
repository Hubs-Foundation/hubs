import React from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import styles from "./Footer.scss";
import discordLogoUrl from "../../assets/images/discord-logo-small.png";
import { Container } from "./Container";

export function Footer({
  hidePoweredBy,
  showWhatsNewLink,
  showTerms,
  termsUrl,
  showPrivacy,
  privacyUrl,
  showCompanyLogo,
  companyLogoUrl,
  showDiscordBotLink,
  appName,
  isHmc
}) {
  return (
    <footer>
      <Container as="div" className={styles.container}>
        <div className={styles.poweredBy}>
          {!hidePoweredBy && (
            <FormattedMessage
              id="footer.powered-by"
              defaultMessage="Powered by <a>MetaversePlus</a>"
              values={{
                // eslint-disable-next-line react/display-name
                a: chunks => (
                  <a className={styles.link} href="/">
                    {chunks}
                  </a>
                )
              }}
            />
          )}
        </div>
        
      </Container>
    </footer>
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
