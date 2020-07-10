import React from "react";
import { FormattedMessage } from "react-intl";
import { createAndRedirectToNewHub } from "../../utils/phoenix-utils";
import { Button } from "../input/Button";

export function CreateRoomButton() {
  return (
    <Button
      primary
      cta
      onClick={e => {
        e.preventDefault();
        createAndRedirectToNewHub(null, null, false);
      }}
    >
      <FormattedMessage id="home.create_a_room" />
    </Button>
  );
}
