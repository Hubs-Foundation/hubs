import React from "react";
import { FormattedMessage } from "react-intl";
import { Button } from "../input/Button";
import { useCreateAndRedirectToRoom } from "../sdk/useCreateAndRedirectToRoom";

export function CreateRoomButton() {
  const { createRoom } = useCreateAndRedirectToRoom();

  return (
    <Button primary cta onClick={() => createRoom()}>
      <FormattedMessage id="home.create_a_room" />
    </Button>
  );
}
