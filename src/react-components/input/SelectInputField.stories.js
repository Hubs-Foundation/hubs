/* eslint-disable @calm/react-intl/missing-formatted-message */
import React from "react";
import { Column } from "../layout/Column";
import { SelectInputField } from "./SelectInputField";

export default {
  title: "Input/SelectInputField"
};

export const All = args => (
  <Column padding>
    <SelectInputField {...args} />
    <SelectInputField label="With Label" {...args} />
    <SelectInputField label="Selected" {...args} value={2} />
  </Column>
);

All.args = {
  options: [
    { id: "1", label: "Option 1", value: 1 },
    { id: "2", label: "Option 2", value: 2 },
    { id: "3", label: "Option 3", value: 3 }
  ]
};

export const StringOptions = args => (
  <Column padding>
    <SelectInputField {...args} />
    <SelectInputField label="With Label" {...args} />
    <SelectInputField label="Selected" {...args} value="Option B" />
  </Column>
);

StringOptions.args = {
  options: ["Option A", "Option B", "Option C"]
};

export const NumberOptions = args => (
  <Column padding>
    <SelectInputField {...args} />
    <SelectInputField label="With Label" {...args} />
    <SelectInputField label="Selected" {...args} value={2} />
  </Column>
);

NumberOptions.args = {
  options: [1, 2, 3]
};
