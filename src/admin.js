import "./utils/debug-log";
import "./assets/stylesheets/admin.scss";

import "./utils/logging";

import ReactDOM from "react-dom";
import React, { Component } from "react";
import PropTypes from "prop-types";
import { connectToReticulum } from "./utils/phoenix-utils";
import { App } from "./App";
import { Admin, Resource, ListGuesser } from "react-admin";
//import { EditGuesser, CreateGuesser } from "react-admin";
import { postgrestClient, postgrestAuthenticatior } from "./utils/postgrest-data-provider";
import { SceneList, SceneEdit } from "./react-components/admin/scenes";
import { AccountList, AccountEdit } from "./react-components/admin/accounts";

window.APP = new App();
const store = window.APP.store;

import registerTelemetry from "./telemetry";
registerTelemetry("/admin", "Hubs Admin");
store.init();

class AdminUI extends Component {
  static propTypes = {
    dataProvider: PropTypes.func,
    authProvider: PropTypes.func
  };

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Admin dataProvider={this.props.dataProvider} authProvider={this.props.authProvider}>
        <Resource name="scenes" list={SceneList} edit={SceneEdit} />
        <Resource name="accounts" list={AccountList} edit={AccountEdit} />
        <Resource name="owned_files" />
        <Resource name="hubs_metrics" list={ListGuesser} />
      </Admin>
    );
  }
}

const mountUI = async retPhxChannel => {
  const dataProvider = postgrestClient("//" + process.env.POSTGREST_SERVER);
  const authProvider = postgrestAuthenticatior.createAuthProvider(retPhxChannel);
  await postgrestAuthenticatior.refreshToken();

  ReactDOM.render(
    <AdminUI dataProvider={dataProvider} authProvider={authProvider} />,
    document.getElementById("ui-root")
  );
};

document.addEventListener("DOMContentLoaded", async () => {
  const socket = connectToReticulum();

  // Refresh perms regularly
  setInterval(() => {
    postgrestAuthenticatior.refreshToken();
  }, 60000);

  // Reticulum global channel
  const retPhxChannel = socket.channel(`ret`, { hub_id: "admin", token: store.state.credentials.token });
  retPhxChannel
    .join()
    .receive("ok", async () => {
      mountUI(retPhxChannel);
    })
    .receive("error", res => {
      console.error(res);
    });
});
