import React from "react";
import { Column } from "../layout/Column";
import { Row } from "../layout/Row";
import { AvatarRadioInput } from "./AvatarRadioInput";

export default {
  title: "AvatarRadioInput",
  parameters: {
    layout: "fullscreen"
  }
};

const avatarModels = [
  {
    label: "Avatar 1",
    thumbnailUrl: "https://demo-ui-stack-assets.hubti.me/files/a9343259-dccb-4e1d-af54-9bfb5ed9df80.png",
    value: "1"
  },
  {
    label: "Avatar 2",
    thumbnailUrl: "https://demo-ui-stack-assets.hubti.me/files/a9343259-dccb-4e1d-af54-9bfb5ed9df80.png",
    value: "2"
  },
  {
    label: "Avatar 3",
    thumbnailUrl: "https://demo-ui-stack-assets.hubti.me/files/a9343259-dccb-4e1d-af54-9bfb5ed9df80.png",
    value: "3"
  }
];

export const Base = () => (
  <Column padding>
    <Row center>{avatarModels.map((props, idx) => <AvatarRadioInput key={idx} name="model" {...props} />)}</Row>
  </Column>
);
