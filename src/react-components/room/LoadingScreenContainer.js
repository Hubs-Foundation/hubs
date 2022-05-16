import React, { useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { useIntl } from "react-intl";
import { LoadingScreen } from "./LoadingScreen";
import { useRoomLoadingState } from "./useRoomLoadingState";

export function LoadingScreenContainer({ onLoaded, scene }) {
  const intl = useIntl();

  const { loading, message } = useRoomLoadingState(scene);

  useEffect(
    () => {
      if (!loading) {
        onLoaded();
      }
    },
    [loading, onLoaded]
  );

  //TODO: Make these configurable
  const infoMessages = useMemo(
    () => [
      {
        heading: intl.formatMessage({ id: "loading-screen.heading.tip", defaultMessage: "Tip:" }),
        message: intl.formatMessage({
          id: "loading-screen.message.keyboard-controls",
          defaultMessage: "Press the Q & E keys to turn left and right."
        })
      },
      {
        heading: intl.formatMessage({ id: "loading-screen.heading.whats-new", defaultMessage: "What's New?" }),
        message: intl.formatMessage(
          {
            id: "loading-screen.message.whats-new",
            defaultMessage: "You can now set the default locale in your preferences. <a>Read More</a>"
          },
          {
            // eslint-disable-next-line react/display-name
            a: chunks => (
              <a href="/whats-new" target="_blank">
                {chunks}
              </a>
            )
          }
        )
      }
    ],
    [intl]
  );

  return <LoadingScreen message={message} infoMessages={infoMessages} />;
}

LoadingScreenContainer.propTypes = {
  scene: PropTypes.object.isRequired,
  onLoaded: PropTypes.func.isRequired
};
