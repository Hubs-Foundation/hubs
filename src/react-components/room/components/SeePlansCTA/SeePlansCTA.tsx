import React from "react";
import { FormattedMessage, defineMessage, useIntl } from "react-intl";
import styles from "./SeePlansCTA.scss";
import configs from "../../../../utils/configs";

const logoAlt = defineMessage({
  id: "see-plans-cta.logo",
  defaultMessage: "Logo"
});

const SeePlansCTA = () => {
  const intl = useIntl();
  const logoAltText = intl.formatMessage(logoAlt);

  return (
    <a className={styles.see_plans_button} href="/" target="_blank">
      <img src={configs.image("logo")} alt={logoAltText} />
      <FormattedMessage id="see-plans-cta.button" defaultMessage={"See Plans"} />
    </a>
  );
};

export default SeePlansCTA;
