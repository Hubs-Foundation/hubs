import React from "react";

import { Create, Edit, TextField, ReferenceField, SimpleForm, TextInput } from "react-admin";

export const IdentityEdit = props => (
  <Edit {...props}>
    <SimpleForm redirect={(path, id, data) => `/accounts/${data.account_id}`}>
      <TextInput source="name" />
    </SimpleForm>
  </Edit>
);

export const IdentityCreate = props => (
  <Create {...props}>
    <SimpleForm redirect={(path, id, data) => `/accounts/${data.account_id}`}>
      <ReferenceField label="Account" reference="accounts" source="account_id" linkType={false}>
        <TextField source="id" />
      </ReferenceField>
      <TextInput source="name" />
    </SimpleForm>
  </Create>
);
