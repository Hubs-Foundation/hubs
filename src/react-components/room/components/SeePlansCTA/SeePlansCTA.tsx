import React from "react";
import { FormattedMessage, defineMessage, useIntl } from "react-intl";
import styles from "./SeePlansCTA.scss";
import hubsLogo from "../../../../assets/images/hubs-logo.png";

const logoAlt = defineMessage({
  id: "see-plans-cta.logo",
  defaultMessage: "Logo"
});

const SeePlansCTA = () => {
  const intl = useIntl();
  const logoAltText = intl.formatMessage(logoAlt);

  return (
    <a className={styles.see_plans_button} href="https://rebrand.ly/3sncpqx" target="_blank">
      <img className={styles.logo} src={hubsLogo} alt={logoAltText} />
      <FormattedMessage id="see-plans-cta.button" defaultMessage={"See Plans"} />
    </a>
  );
};

export default SeePlansCTA;
