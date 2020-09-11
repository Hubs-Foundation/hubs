import React from "react";
import { SelectInputField } from "./SelectInputField";

export default {
  title: "SelectInputField"
};

export const All = args => (
  <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
    <SelectInputField {...args} />
    <SelectInputField label="With Label" {...args} />
    <SelectInputField label="Selected" {...args} value={2} />
  </div>
);

All.args = {
  options: [
    { id: "1", label: "Option 1", value: 1 },
    { id: "2", label: "Option 2", value: 2 },
    { id: "3", label: "Option 3", value: 3 }
  ]
};

export const StringOptions = args => (
  <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
    <SelectInputField {...args} />
    <SelectInputField label="With Label" {...args} />
    <SelectInputField label="Selected" {...args} value="Option B" />
  </div>
);

StringOptions.args = {
  options: ["Option A", "Option B", "Option C"]
};

export const NumberOptions = args => (
  <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
    <SelectInputField {...args} />
    <SelectInputField label="With Label" {...args} />
    <SelectInputField label="Selected" {...args} value={2} />
  </div>
);

NumberOptions.args = {
  options: [1, 2, 3]
};
