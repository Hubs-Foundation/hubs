import React, { Component } from "react";
import { IdentityEditLink, IdentityCreateLink } from "./fields";
import { withStyles } from "@material-ui/core/styles";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import MuiTextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import CircularProgress from "@material-ui/core/CircularProgress";
import Snackbar from "@material-ui/core/Snackbar";
import SnackbarContent from "@material-ui/core/SnackbarContent";

import {
  BooleanField,
  BooleanInput,
  Datagrid,
  DateField,
  Edit,
  EditButton,
  Filter,
  List,
  ReferenceManyField,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput
} from "react-admin";

const styles = {
  hide: { display: "none" },
  noBorder: { border: "0px" },
  searchCard: { marginBottom: "5px" }
};

const AccountFilter = props => (
  <Filter {...props}>
    <TextInput label="Search ID" source="_text_id" alwaysOn />
  </Filter>
);

export const AccountList = withStyles(styles)(
  class AccountList extends Component {
    state = {};
    async onAccountSearch(e) {
      e.preventDefault();
      this.setState({ searching: true, accountSearchStatus: null });
      const result = await fetch("/api/v1/accounts/search", {
        method: "post",
        headers: {
          "content-type": "application/json",
          authorization: `bearer ${window.APP.store.state.credentials.token}`
        },
        body: JSON.stringify({ email: this.state.email || "" })
      }).then(r => r.json());
      if (result && result.data) {
        window.location = `#/accounts/${result.data[0].id}`;
      } else {
        this.setState({ searching: false, accountSearchStatus: "Account not found" });
      }
    }
    render() {
      const { classes } = this.props;

      return (
        <>
          <Card classes={{ root: classes.searchCard }}>
            <CardContent>
              <Typography component="h2">Find an account with an email address</Typography>
              <form onSubmit={this.onAccountSearch.bind(this)}>
                <MuiTextField
                  label="Account Email"
                  type="email"
                  required
                  onChange={e => this.setState({ email: e.target.value })}
                />
                <Button onClick={this.onAccountSearch.bind(this)}>Find</Button>
                {this.state.searching && <CircularProgress />}
                <Snackbar open={!!this.state.accountSearchStatus} autoHideDuration={5000}>
                  <SnackbarContent message={this.state.accountSearchStatus}></SnackbarContent>
                </Snackbar>
              </form>
            </CardContent>
          </Card>
          <List {...this.props} filters={<AccountFilter />}>
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
              <TextField source="state" />
              <EditButton />
            </Datagrid>
          </List>
        </>
      );
    }
  }
);

export const AccountEdit = withStyles(styles)(props => {
  const { classes } = props;

  return (
    <Edit {...props}>
      <SimpleForm>
        <TextField label="Account ID" source="id" />
        <BooleanInput source="is_admin" />
        <SelectInput
          source="state"
          choices={[{ id: "enabled", name: "enabled" }, { id: "disabled", name: "disabled" }]}
        />

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
