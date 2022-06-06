import React from "react";
import { FormattedMessage } from "react-intl";
import { createAndRedirectToNewHub } from "../../utils/phoenix-utils";
import { Button } from "../input/Button";
import { useCssBreakpoints } from "react-use-css-breakpoints";

export function CreateEventButton() {
  const breakpoint = useCssBreakpoints();

  return (
    <Button
      thick={breakpoint === "sm" || breakpoint === "md"}
      xl={breakpoint !== "sm" && breakpoint !== "md"}
      preset="landing"
      onClick={e => {
        e.preventDefault();
        createAndRedirectToNewHub("User ID#", "6JzWnLq", false);
      }}
    >
      <FormattedMessage id="create-event-button" defaultMessage="Create Event" />
    </Button>
  );
}
