import React from "react";
import PropTypes from "prop-types";
import IfFeature from "../if-feature";
import { getMessages } from "../../utils/i18n";
import configs from "../../utils/configs";
import { FormattedMessage } from "react-intl";

export function ExitedRoomScreen({ reason }) {
  let subtitle = null;
  if (reason === "closed") {
    // TODO i18n, due to links and markup
    subtitle = (
      <div>
        Sorry, this room is no longer available.
        <p />
        <IfFeature name="show_terms">
          A room may be closed by the room owner, or if we receive reports that it violates our{" "}
          <a
            target="_blank"
            rel="noreferrer noopener"
            href={configs.link("terms_of_use", "https://github.com/mozilla/hubs/blob/master/TERMS.md")}
          >
            Terms of Use
          </a>
          .<br />
        </IfFeature>
        If you have questions, contact us at{" "}
        <a href={`mailto:${getMessages()["contact-email"]}`}>
          <FormattedMessage id="contact-email" />
        </a>
        .<p />
        <IfFeature name="show_source_link">
          If you&apos;d like to run your own server, Hubs&apos;s source code is available on{" "}
          <a href="https://github.com/mozilla/hubs">GitHub</a>
          .
        </IfFeature>
      </div>
    );
  } else {
    const tcpUrl = new URL(document.location.toString());
    const tcpParams = new URLSearchParams(tcpUrl.search);
    tcpParams.set("force_tcp", true);
    tcpUrl.search = tcpParams.toString();

    const exitSubtitleId = `exit.subtitle.${reason}`;
    subtitle = (
      <div>
        <FormattedMessage id={exitSubtitleId} />
        <p />
        {reason === "connect_error" && (
          <div>
            You can try <a href={tcpUrl.toString()}>connecting via TCP</a>, which may work better on some networks.
          </div>
        )}
        {!["left", "disconnected", "scene_error"].includes(reason) && (
          <div>
            You can also <a href="/">create a new room</a>
            .
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="exited-panel">
      <img className="exited-panel__logo" src={configs.image("logo")} />
      <div className="exited-panel__subtitle">{subtitle}</div>
    </div>
  );
}

ExitedRoomScreen.propTypes = {
  reason: PropTypes.string
};
