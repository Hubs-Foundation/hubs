import React from "react";
import { useContext } from "react";
import { FormattedMessage } from "react-intl";
import { createAndRedirectToNewHub } from "../../utils/phoenix-utils";
import { Button } from "../input/Button";
import { useCssBreakpoints } from "react-use-css-breakpoints";
import { AuthContext } from "../auth/AuthContext";
import { jwt } from "jsonwebtoken";
export function CreateEventButton() {
  const breakpoint = useCssBreakpoints();
  const auth = useContext(AuthContext);

  const email = auth.email;
  const token = jwt.encode(email);
  return (
    <Button
      thick={breakpoint === "sm" || breakpoint === "md"}
      xl={breakpoint !== "sm" && breakpoint !== "md"}
      preset="landing"
      onClick={e => {
        e.preventDefault();
        createAndRedirectToNewHub(token, "6JzWnLq", false);
      }}
    >
      <FormattedMessage id="create-event-button" defaultMessage="Create Event" />
    </Button>
  );
}
