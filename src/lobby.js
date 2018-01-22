import React from "react";
import ReactDOM from "react-dom";
import { JanusSession, JanusPluginHandle } from "minijanus";

import "material-design-lite";
import "material-design-lite/material.css";
import "./lobby.css";

import registerTelemetry from "./telemetry";

registerTelemetry();

class Lobby extends React.Component {
  constructor() {
    super();
    this.state = { rooms: [] };

    this.onWebsocketOpen = this.onWebsocketOpen.bind(this);
    this.onWebsocketMessage = this.onWebsocketMessage.bind(this);
    this.updateRooms = this.updateRooms.bind(this);
  }

  componentDidMount() {
    this.ws = new WebSocket(window.CONFIG.janus_server_url, "janus-protocol");
    this.session = new JanusSession(this.ws.send.bind(this.ws));
    this.ws.addEventListener("open", this.onWebsocketOpen);
    this.ws.addEventListener("message", this.onWebsocketMessage);
  }

  componentWillUnmount() {
    clearInterval(this.pollRoomsIntervalHandle);
    this.ws.removeEventListener("open", this.onWebsocketOpen);
    this.ws.removeEventListener("message", this.onWebsocketMessage);
  }

  onWebsocketOpen() {
    this.session
      .create()
      .then(() => {
        this.handle = new JanusPluginHandle(this.session);
        return this.handle.attach("janus.plugin.sfu").then(this.updateRooms);
      })
      .then(() => {
        this.pollRoomsIntervalHandle = setInterval(this.updateRooms, 10000);
      });
  }

  updateRooms() {
    return this.fetchRooms().then(rooms => this.setState({ rooms }));
  }

  fetchRooms() {
    return this.handle.sendMessage({ kind: "listusers" }).then(signal => {
      const usersByRoom = signal.plugindata.data.response.users;
      return window.CONFIG.public_rooms.map(id => ({
        id,
        limit: 12,
        users: usersByRoom[id] || []
      }));
    });
  }

  onWebsocketMessage(event) {
    var message = JSON.parse(event.data);
    this.session.receive(message);
  }

  render() {
    return (
      <div className="overlay">
        <RoomList rooms={this.state.rooms} />
      </div>
    );
  }
}

const RoomListItem = ({ room }) => {
  return (
    <li className="room-item mdl-list__item mdl-list__item--two-line">
      <a href={`room.html?room=${room.id}`}>
        <span className="mdl-list__item-primary-content">
          <i className="material-icons mdl-list__item-icon">room</i>
          <span>Meeting room {room.id}</span>
          <span className="mdl-list__item-sub-title">
            {room.users.length}/{room.limit}
          </span>
        </span>
      </a>
    </li>
  );
};

const RoomList = ({ rooms }) => {
  const publicRooms = window.CONFIG.public_rooms.length + 1;
  const roomId =
    publicRooms +
    Math.floor(Math.random() * (Number.MAX_SAFE_INTEGER - publicRooms));

  return (
    <div className="mdl-card mdl-shadow--2dp panel">
      <ul className="mdl-list scroll">
        {rooms.map(room => <RoomListItem key={room.id} room={room} />)}
      </ul>
      <ul className="mdl-list">
        <li className="mdl-list__item room-item">
          <a href={`room.html?room=${roomId}`}>
            <span className="mdl-list__item-primary-content">
              <i className="material-icons mdl-list__item-icon">add</i>
              New Meeting Room
            </span>
          </a>
        </li>
      </ul>
    </div>
  );
};

ReactDOM.render(<Lobby />, document.getElementById("root"));
