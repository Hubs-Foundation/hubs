import React from "react";
import styles from "./Tokens.scss";
import styleUtils from "../styles/style-utils.scss";
import { Row } from "../layout/Row";
import { ReactComponent as HubsDuckIcon } from "../icons/footer-duck.svg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Column } from "../layout/Column";
import { FormattedMessage } from "react-intl";
import { faTimesCircle } from "@fortawesome/free-solid-svg-icons/faTimesCircle";

export const NoAccess = () => {
  return (
    <Column padding="xl" className={styles.noAccessContainer} lastChildMargin={false}>
      <Row noWrap>
        <div className={styles.noAccessIcon}>
          <FontAwesomeIcon icon={faTimesCircle} />
        </div>
        <h2>
          <FormattedMessage
            id="tokens.administrator-privileges-required"
            defaultMessage="Administrator privileges required"
          />
        </h2>
      </Row>
      <div className={styleUtils.mdMarginY}>
        <p className={styleUtils.margin0}>
          <FormattedMessage
            id="tokens.no-access-description1"
            defaultMessage="You do not have sufficient privileges to create API tokens."
          />
        </p>
        <p>
          <FormattedMessage
            id="tokens.no-access-description2"
            defaultMessage="If you believe you should have access to this page, please request privileges from your Hubs administrator."
          />
        </p>
      </div>
      <div className={styles.noAccessFooterDuckContainer}>
        <HubsDuckIcon className={styles.noAccessFooterDuck} />
      </div>
    </Column>
  );
};
