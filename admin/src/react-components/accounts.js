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

// props: color='textSecondary'|'textPrimary' message='' accounts= ''
const CreateAccountDetails = props => (
  <>
    <Typography component="p" color={props.color} style={{ padding: "10px" }}>
      {props.message}
    </Typography>
    <Typography component="p" color={props.color} style={{ padding: "10px" }}>
      {props.accounts}
    </Typography>
  </>
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
      createStatus: null,
      createResults: ""
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
          .filter(email => email !== "")
          .map(email =>
            this.state.identityCreate.length
              ? { email: email.trim(), name: this.state.identityCreate }
              : { email: email.trim() }
          );
      } else {
        // create single account
        // {email: , name?: }
        data = this.state.identityCreate.length
          ? { email: this.state.emailCreate.trim(), name: this.state.identityCreate }
          : { email: this.state.emailCreate.trim() };
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
      console.log(data);
      console.log(result);
      if (result && result.data) {
        // one email added successfully
        this.setState({ creating: false, createStatus: `Account created successfully` });
      } else if (result && result.errors) {
        // one email has errors
        status = result.errors[0].detail;
        this.setState({ creating: false, createStatus: status });
      } else if (Array.isArray(result)) {
        // Multiple email accounts created
        // At least one error exists in the list
        let hasOneSuccess = false;
        const results = result.reduce((prev, cur, index) => {
          hasOneSuccess = hasOneSuccess || cur.status === 200;
          const message = cur.status === 200 ? "Created accounts successfully" : cur.body.errors[0].detail;
          const email = data[index].email;
          prev[message] = Array.isArray(prev[message]) ? prev[message].push(email) : [email];
          return prev;
        }, {});
        console.log("errors");
        console.log(errors);
        this.setState({
          creating: false,
          createStatus: hasOneSuccess ? "Success adding accounts with errors" : "Errors adding accounts",
          createResults: results
        });
      }

      //{"data":{"login":{"email":"thetriforcegoddess@gmail.com"},"identity":{"name":"bahabah"},"id":"697762611709607972"}}

      //{"errors":[{"source":"data","detail":"Account with email already exists.","code":"RECORD_EXISTS"}]}

      // [
      //   {"status":400,"body":{"errors":[{"source":"data[0]","detail":"Account with email already exists.","code":"RECORD_EXISTS"}]}},
      //   {"status":400,"body":{"errors":[{"source":"data[1]","detail":"Account with email already exists.","code":"RECORD_EXISTS"}]}}
      // ]

      // [
      // {"status":400,"body":{"errors":[{"source":"data[0]","detail":"Account with email already exists.","code":"RECORD_EXISTS"}]}},
      // {"status":400,"body":{"errors":[{"source":"data[1]","detail":"Account with email already exists.","code":"RECORD_EXISTS"}]}}
      // ]
    }
    render() {
      const { classes } = this.props;
      return (
        <>
          <Card classes={{ root: classes.searchCard }}>
            <CardContent>
              <Typography component="h2">Create account(s) (separate emails with &quot;;&quot;)</Typography>
              <form onSubmit={this.onCreateAccount.bind(this)}>
                <MuiTextField
                  label="Email address(es)"
                  type="email"
                  style={{ minWidth: "300px" }}
                  required
                  onChange={e => this.setState({ emailCreate: e.target.value })}
                />
                <br />
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
              {this.state.createResults &&
                Object.keys(this.state.createResults).map(message => (
                  <>
                    <Typography component="p" color="textPrimary" style={{ paddingTop: "10px" }}>
                      {message}
                    </Typography>
                    <Typography component="p" color="textSecondary" style={{ paddingBottom: "10px" }}>
                      [ {this.state.createResults[message].join(", ")} ]
                    </Typography>
                  </>
                ))}
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
