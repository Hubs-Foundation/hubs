/* eslint-disable @calm/react-intl/missing-formatted-message */
import React from "react";
import { Column } from "../layout/Column";
import { Button, presets } from "./Button";

export default {
  title: "Input/Button"
};

export const All = () => (
  <Column padding>
    {presets.map(preset => (
      <Button key={preset} preset={preset}>
        {preset.replace(/^\w/, c => c.toUpperCase())}
      </Button>
    ))}
    <Button disabled>Disabled</Button>
    <Button>Really Really Long Button Name</Button>
  </Column>
);
