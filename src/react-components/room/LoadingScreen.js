import React from "react";
import PropTypes from "prop-types";
import { LoadingScreenLayout } from "../layout/LoadingScreenLayout";
import { Spinner } from "../misc/Spinner";
import { useRandomMessageTransition } from "./useRandomMessageTransition";
import configs from "../../utils/configs";
import hmcLogo from "../../assets/images/hmc-logo.png";
import SaveConsoleLog from "../../utils/record-log.js";
import qsTruthy from "../../utils/qs_truthy";
import { Button } from "../input/Button";
export function LoadingScreen({ logoSrc, message, infoMessages }) {
  const infoMessage = useRandomMessageTransition(infoMessages);
  const isHmc = configs.feature("show_cloud");
  return (
    <LoadingScreenLayout
      logoSrc={isHmc ? hmcLogo : logoSrc}
      center={
        <>
          <Spinner />
          <p>{message}</p>
        </>
      }
      bottom={
        <>
          <h3>{infoMessage.heading}</h3>
          <p>{infoMessage.message}</p>
          { qsTruthy("record_log") && <Button preset="basic" onClick={() => SaveConsoleLog()}>Save Logs</Button> }
        </>
      }
    />
  );
}

LoadingScreen.propTypes = {
  logoSrc: PropTypes.string,
  message: PropTypes.node,
  infoMessages: PropTypes.arrayOf(
    PropTypes.shape({
      heading: PropTypes.node.isRequired,
      message: PropTypes.node.isRequired
    })
  )
};

LoadingScreen.defaultProps = {
  infoMessages: []
};
