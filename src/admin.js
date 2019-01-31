import "./utils/debug-log";
import "./assets/stylesheets/admin.scss";

import "./utils/logging";

import ReactDOM from "react-dom";
import React, { Component } from "react";
import PropTypes from "prop-types";
//import classNames from "classnames";
import { connectToReticulum } from "./utils/phoenix-utils";
import { App } from "./App";
import { Admin, Resource, ListGuesser } from "react-admin";
import { postgrestClient, postgrestAuthenticatior } from "./utils/postgrest-data-provider";
import { SceneList } from "./react-components/admin/scenes";

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
        <Resource name="scenes" list={SceneList} />
        <Resource name="accounts" />
      </Admin>
    );
  }
}

const mountUI = retPhxChannel => {
  const dataProvider = postgrestClient("//" + process.env.POSTGREST_SERVER);
  const authProvider = postgrestAuthenticatior.createAuthProvider(retPhxChannel);

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

  /*hubPhxChannel.on("naf", data => {
    if (!NAF.connection.adapter) return;
    NAF.connection.adapter.onData(data);
  });*/
});
