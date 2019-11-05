import React from "react";

import {
  List,
  Edit,
  SimpleForm,
  TextInput,
  BooleanInput,
  Datagrid,
  TextField,
  DateField,
  BooleanField,
  EditButton,
  Filter
} from "react-admin";

const AccountFilter = props => (
  <Filter {...props}>
    <TextInput label="Search ID" source="_text_id" alwaysOn />
  </Filter>
);

export const AccountList = props => (
  <List {...props} filters={<AccountFilter />}>
    <Datagrid>
      <TextField source="id" />
      <DateField source="inserted_at" />
      <DateField source="updated_at" />
      <BooleanField source="is_admin" />
      <EditButton />
    </Datagrid>
  </List>
);

export const AccountEdit = props => (
  <Edit {...props}>
    <SimpleForm>
      <BooleanInput source="is_admin" />
    </SimpleForm>
  </Edit>
);
