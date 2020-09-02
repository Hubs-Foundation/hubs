import React from "react";
import { SelectInputField } from "./SelectInputField";

export default {
  title: "SelectInputField"
};

export const All = args => (
  <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
    <SelectInputField {...args} />
    <SelectInputField label="With Label" {...args} />
  </div>
);

All.args = {
  items: [{ id: 1, label: "Option 1" }, { id: 2, label: "Option 2" }, { id: 3, label: "Option 3" }]
};
