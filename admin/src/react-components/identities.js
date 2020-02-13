import React from "react";

import { Edit, SimpleForm, TextInput } from "react-admin";

export const IdentityEdit = props => (
  <Edit {...props}>
    <SimpleForm>
      <TextInput source="name" />
    </SimpleForm>
  </Edit>
);
