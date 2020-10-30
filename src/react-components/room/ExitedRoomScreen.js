import React from "react";
import PropTypes from "prop-types";
import { defineMessages, useIntl } from "react-intl";
import { LoadingScreenLayout } from "../layout/LoadingScreenLayout";

const messages = defineMessages({
  exited: {
    id: "exit.subtitle.exited",
    defaultMessage: "Your session has ended. Refresh your browser to start a new one."
  },
  closed: {
    id: "exit.subtitle.closed",
    defaultMessage: "This room is no longer available."
  },
  denied: {
    id: "exit.subtitle.denied",
    defaultMessage: "You are not permitted to join this room. Please request permission from the room creator."
  },
  disconnected: {
    id: "exit.subtitle.disconnected",
    defaultMessage: "You have disconnected from the room. Refresh the page to try to reconnect."
  },
  left: {
    id: "exit.subtitle.left",
    defaultMessage: "You have left the room."
  },
  full: {
    id: "exit.subtitle.full",
    defaultMessage: "This room is full, please try again later."
  },
  scene_error: {
    id: "exit.subtitle.scene_error",
    defaultMessage: "The scene failed to load."
  },
  connect_error: {
    id: "exit.subtitle.connect_error",
    defaultMessage: "Unable to connect to this room, please try again later."
  },
  version_mismatch: {
    id: "exit.subtitle.version_mismatch",
    defaultMessage: "The version you deployed is not available yet. Your browser will refresh in 5 seconds."
  }
});

export function ExitedRoomScreen({ reason, showTerms, termsUrl, logoSrc, showSourceLink }) {
  const intl = useIntl();

  let subtitle = null;
  if (reason === "closed") {
    const contactEmail = intl.formatMessage({ id: "contact-email" });

    // TODO i18n, due to links and markup
    subtitle = (
      <>
        <b>Sorry, this room is no longer available.</b>
        {showTerms && (
          <p>
            A room may be closed by the room owner, or if we receive reports that it violates our{" "}
            <a target="_blank" rel="noreferrer noopener" href={termsUrl}>
              Terms of Use
            </a>
            .
          </p>
        )}
        <p>
          If you have questions, contact us at <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
          .
        </p>
        {showSourceLink && (
          <p>
            If you&apos;d like to run your own server, Hubs&apos;s source code is available on{" "}
            <a href="https://github.com/mozilla/hubs">GitHub</a>.
          </p>
        )}
      </>
    );
  } else {
    const tcpUrl = new URL(document.location.toString());
    const tcpParams = new URLSearchParams(tcpUrl.search);
    tcpParams.set("force_tcp", true);
    tcpUrl.search = tcpParams.toString();

    subtitle = (
      <>
        <b>{intl.formatMessage(messages[reason])}</b>

        {reason === "connect_error" && (
          <p>
            You can try <a href={tcpUrl.toString()}>connecting via TCP</a>, which may work better on some networks.
          </p>
        )}
        {!["left", "disconnected", "scene_error"].includes(reason) && (
          <p>
            You can also <a href="/">create a new room</a>.
          </p>
        )}
      </>
    );
  }

  return <LoadingScreenLayout center={subtitle} logoSrc={logoSrc} />;
}

ExitedRoomScreen.propTypes = {
  reason: PropTypes.string.isRequired,
  showTerms: PropTypes.bool,
  termsUrl: PropTypes.string,
  logoSrc: PropTypes.string,
  showSourceLink: PropTypes.bool
};
