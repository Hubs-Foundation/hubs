import React from "react";
import { useContext } from "react";
import { FormattedMessage } from "react-intl";
// import { createAndRedirectToNewHub } from "../../utils/phoenix-utils";
import { Button } from "../input/Button";
import { useCssBreakpoints } from "react-use-css-breakpoints";
import { AuthContext } from "../auth/AuthContext";
export function CreateEventButton() {
  const breakpoint = useCssBreakpoints();
  const auth = useContext(AuthContext);



  return (
    <Button style={{backgroundColor: "#ff1100" ,  borderRadius: "30px", border: "none" }}
      thick={breakpoint === "sm" || breakpoint === "md"}
      xl={breakpoint !== "sm" && breakpoint !== "md"}
      preset="landing"as="a" href="/tokens">
    <FormattedMessage id="create-room-button" defaultMessage="Create Event" />
  </Button>
  );
}
