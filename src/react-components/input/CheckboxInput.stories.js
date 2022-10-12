/* eslint-disable @calm/react-intl/missing-formatted-message */
import React from "react";
import { Column } from "../layout/Column";
import { CheckboxInput } from "./CheckboxInput";

export default {
  title: "Input/CheckboxInput",
  argTypes: { onChange: { action: "onChange" } }
};

export const All = args => (
  <Column padding="sm" gap="sm">
    <CheckboxInput {...args} />
    <CheckboxInput label="Checkbox input" {...args} />
    <CheckboxInput label="Checkbox input" checked={false} {...args} />
    <CheckboxInput label="Checkbox input" checked={true} {...args} />
    <CheckboxInput label="Checkbox input" checked={false} disabled {...args} />
    <CheckboxInput label="Checkbox input" checked={true} disabled {...args} />
    <CheckboxInput label="Checkbox input" description="With description" {...args} />
  </Column>
);
