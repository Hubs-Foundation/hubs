import React from "react";
import PropTypes from "prop-types";
import { getMessages } from "../../utils/i18n";
import configs from "../../utils/configs";
import { FormattedMessage } from "react-intl";
import { LoadingScreenLayout } from "../layout/LoadingScreenLayout";

export function ExitedRoomScreen({ reason }) {
  let subtitle = null;
  if (reason === "closed") {
    // TODO i18n, due to links and markup
    subtitle = (
      <>
        <b>Sorry, this room is no longer available.</b>
        {configs.feature("show_terms") && (
          <p>
            A room may be closed by the room owner, or if we receive reports that it violates our{" "}
            <a
              target="_blank"
              rel="noreferrer noopener"
              href={configs.link("terms_of_use", "https://github.com/mozilla/hubs/blob/master/TERMS.md")}
            >
              Terms of Use
            </a>
            .
          </p>
        )}
        <p>
          If you have questions, contact us at{" "}
          <a href={`mailto:${getMessages()["contact-email"]}`}>
            <FormattedMessage id="contact-email" />
          </a>
          .
        </p>
        {configs.feature("show_source_link") && (
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

    const exitSubtitleId = `exit.subtitle.${reason}`;
    subtitle = (
      <>
        <b>
          <FormattedMessage id={exitSubtitleId} />
        </b>

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

  return <LoadingScreenLayout center={subtitle} logoSrc={configs.image("logo")} />;
}

ExitedRoomScreen.propTypes = {
  reason: PropTypes.string
};
