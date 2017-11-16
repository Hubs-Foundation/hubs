import React from "react";
import ReactDOM from "react-dom";
import mj from "minijanus";

import Config from "./config";

import "./lobby.css";

class Lobby extends React.Component {
  constructor() {
    super();
    this.state = { rooms: [] };

    this.onWebsocketOpen = this.onWebsocketOpen.bind(this);
    this.onWebsocketMessage = this.onWebsocketMessage.bind(this);
    this.updateRooms = this.updateRooms.bind(this);
  }

  componentDidMount() {
    this.ws = new WebSocket(Config.janus_server_url, "janus-protocol");
    this.session = new mj.JanusSession(this.ws.send.bind(this.ws));
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
        this.handle = new mj.JanusPluginHandle(this.session);
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
    return Promise.all(
      Config.public_rooms.map(room_id => {
        return this.handle
          .sendMessage({
            kind: "listusers",
            room_id
          })
          .then(signal => ({
            id: room_id,
            limit: 12,
            users: signal.plugindata.data.response.user_ids
          }));
      })
    );
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
  const publicRooms = Config.public_rooms.length + 1;
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
