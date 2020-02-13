import React from "react";
import { IdentityEditLink, IdentityCreateLink } from "./fields";
import { withStyles } from "@material-ui/core/styles";

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
  ReferenceManyField,
  EditButton,
  Filter
} from "react-admin";

const styles = {
  hide: { display: "none" },
  noBorder: { border: "0px" }
};

const AccountFilter = props => (
  <Filter {...props}>
    <TextInput label="Search ID" source="_text_id" alwaysOn />
  </Filter>
);

export const AccountList = withStyles(styles)(props => {
  const { classes } = props;

  return (
    <List {...props} filters={<AccountFilter />}>
      <Datagrid>
        <TextField source="id" />
        <DateField source="inserted_at" />
        <DateField source="updated_at" />
        <ReferenceManyField label="Identity" target="_account_id" reference="identities">
          <Datagrid classes={{ rowCell: classes.noBorder, thead: classes.hide }}>
            <TextField source="name" />
            <IdentityEditLink />
          </Datagrid>
        </ReferenceManyField>

        <IdentityCreateLink />
        <BooleanField source="is_admin" />
        <EditButton />
      </Datagrid>
    </List>
  );
});

export const AccountEdit = withStyles(styles)(props => {
  const { classes } = props;

  return (
    <Edit {...props}>
      <SimpleForm>
        <TextField label="Account ID" source="id" />
        <BooleanInput source="is_admin" />

        <ReferenceManyField label="Identity" target="_account_id" reference="identities">
          <Datagrid classes={{ rowCell: classes.noBorder, thead: classes.hide }}>
            <TextField source="name" />
            <IdentityEditLink />
          </Datagrid>
        </ReferenceManyField>
      </SimpleForm>
    </Edit>
  );
});
