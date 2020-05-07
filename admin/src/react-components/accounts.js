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
    state = {
      emailSearch: "",
      searching: false,
      searchStatus: null,
      emailCreate: "",
      identityCreate: "",
      creating: false,
      createStatus: null
    };
    async onAccountSearch(e) {
      e.preventDefault();
      this.setState({ searching: true, searchStatus: null });
      const result = await fetch("/api/v1/accounts/search", {
        method: "post",
        headers: {
          "content-type": "application/json",
          authorization: `bearer ${window.APP.store.state.credentials.token}`
        },
        body: JSON.stringify({ email: this.state.emailSearch || "" })
      }).then(r => r.json());
      if (result && result.data) {
        window.location = `#/accounts/${result.data[0].id}`;
      } else {
        this.setState({ searching: false, searchStatus: "Account not found" });
      }
    }
    async onCreateAccount(e) {
      e.preventDefault();
      this.setState({ creating: true, createStatus: null });
      let data = {};
      if (this.state.emailCreate.includes(";")) {
        // create multiple accounts using email
        // [{email: , name?: }, {email: , name?: }]
        data = this.state.emailCreate
          .split(";")
          .map(email =>
            this.state.identityCreate.length ? { email: email, name: this.state.identityCreate } : { email }
          );
      } else {
        // create single account
        // {email: , name?: }
        data = this.state.identityCreate.length
          ? { email: this.state.emailCreate, name: this.state.identityCreate }
          : { email: this.state.emailCreate };
      }
      const result = await fetch("/api/v1/accounts", {
        method: "post",
        headers: {
          "content-type": "application/json",
          authorization: `bearer ${window.APP.store.state.credentials.token}`
        },
        body: JSON.stringify({
          data: data
        })
      }).then(r => r.json());
      if (result && result.data) {
        console.log(result);
        this.setState({ creating: false, createStatus: "Account created" });
      } else {
        console.log(result);
        this.setState({ creating: false, createStatus: "Could not create account" });
      }
    }
    render() {
      const { classes } = this.props;

      console.log(this.state.emailCreate);
      console.log(this.state.identityCreate);

      return (
        <>
          <Card classes={{ root: classes.searchCard }}>
            <CardContent>
              <Typography component="h2">Create account</Typography>
              <form onSubmit={this.onCreateAccount.bind(this)}>
                <MuiTextField
                  label="Email address"
                  type="email"
                  required
                  onChange={e => this.setState({ emailCreate: e.target.value })}
                />
                <MuiTextField
                  label="Identity (optional)"
                  type="text"
                  onChange={e => this.setState({ identityCreate: e.target.value })}
                />
                <Button onClick={this.onCreateAccount.bind(this)}>Create</Button>
                {this.state.creating && <CircularProgress />}
                <Snackbar open={!!this.state.createStatus} autoHideDuration={5000}>
                  <SnackbarContent message={this.state.createStatus}></SnackbarContent>
                </Snackbar>
              </form>
            </CardContent>
          </Card>
          <Card classes={{ root: classes.searchCard }}>
            <CardContent>
              <Typography component="h2">Find an account with an email address</Typography>
              <form onSubmit={this.onAccountSearch.bind(this)}>
                <MuiTextField
                  label="Account Email"
                  type="email"
                  required
                  onChange={e => this.setState({ emailSearch: e.target.value })}
                />
                <Button onClick={this.onAccountSearch.bind(this)}>Find</Button>
                {this.state.searching && <CircularProgress />}
                <Snackbar open={!!this.state.searchStatus} autoHideDuration={5000}>
                  <SnackbarContent message={this.state.searchStatus}></SnackbarContent>
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
