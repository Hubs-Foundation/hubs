import React, { Component, createRef } from "react";
import PropTypes from "prop-types";
import DialogContainer from "./dialog-container";
import { fetchReticulumAuthenticated } from "../utils/phoenix-utils";

function parseTSVInt(value) {
  const intVal = parseInt(value);
  return isNaN(intVal) ? undefined : intVal;
}

function parseTSVBool(value) {
  return value.toLowerCase().trim() === "true";
}

async function fetchPublicRooms() {
  let hasMore = true;
  const results = [];

  const queryParams = new URLSearchParams();
  queryParams.set("source", "rooms");
  queryParams.set("filter", "public");

  while (hasMore) {
    const res = await fetchReticulumAuthenticated(`/api/v1/media/search?${queryParams}`);

    for (const entry of res.entries) {
      results.push(entry);
    }

    queryParams.set("cursor", res.meta.next_cursor);
    hasMore = !!res.meta.next_cursor;
  }

  return results;
}

export default class RoomManagementDialog extends Component {
  static propTypes = {
    onClose: PropTypes.func,
    closable: PropTypes.bool
  };

  static defaultProps = {
    closable: true
  };

  constructor(props) {
    super(props);

    this.fileInputRef = createRef();
  }

  onSubmit = async () => {
    const tsv = await this.fileInputRef.current.files[0].text();
    const lines = tsv.split("\n");
    lines.shift();

    const newLines = [];
    const header = [
      "Room Id",
      "Room Name",
      "Room Description",
      "Scene Id",
      "Group Order",
      "Room Order",
      "Room Size",
      "Spawn and Move Media",
      "Spawn Camera",
      "Spawn Drawing",
      "Pin Objects",
      "Public"
    ];
    newLines.push(header.join("\t"));

    for (const line of lines) {
      let [
        id,
        name,
        description,
        scene_id,
        group_order,
        room_order,
        room_size,
        spawn_and_move_media,
        spawn_camera,
        spawn_drawing,
        pin_objects,
        allow_promotion
      ] = line.split("\t");

      const roomParams = {
        hub: {
          name,
          description,
          scene_id: scene_id || undefined,
          user_data: {
            group_order: parseTSVInt(group_order),
            room_order: parseTSVInt(room_order)
          },
          member_permissions: {
            spawn_and_move_media: parseTSVBool(spawn_and_move_media),
            spawn_camera: parseTSVBool(spawn_camera),
            spawn_drawing: parseTSVBool(spawn_drawing),
            pin_objects: parseTSVBool(pin_objects)
          },
          room_size: parseTSVInt(room_size),
          allow_promotion: parseTSVBool(allow_promotion)
        }
      };

      let new_id = id;

      if (id) {
        await fetchReticulumAuthenticated(`/api/v1/hubs/${id}`, "PATCH", roomParams);
      } else {
        const res = await fetchReticulumAuthenticated(`/api/v1/hubs`, "POST", roomParams);
        new_id = res.hub_id;

        await new Promise(resolve => setTimeout(resolve, 2500));

        await fetchReticulumAuthenticated(`/api/v1/hubs/${new_id}`, "PATCH", roomParams);
      }

      const newLine = [
        new_id,
        name,
        description,
        scene_id,
        group_order,
        room_order,
        room_size,
        spawn_and_move_media,
        spawn_camera,
        spawn_drawing,
        pin_objects,
        allow_promotion
      ];
      newLines.push(newLine.join("\t"));

      await new Promise(resolve => setTimeout(resolve, 2500));
    }

    const newTsv = newLines.join("\n");

    const blob = new Blob([newTsv], { type: "text/tsv" });

    const downloadEl = document.createElement("a");
    downloadEl.download = "room-list.tsv";
    downloadEl.href = URL.createObjectURL(blob);
    downloadEl.click();

    this.props.onClose();
  };

  onDownloadRoomList = async () => {
    const rooms = await fetchPublicRooms();
    const lines = [];

    const header = [
      "Room Id",
      "Room Name",
      "Room Description",
      "Scene Id",
      "Group Order",
      "Room Order",
      "Room Size",
      "Spawn and Move Media",
      "Spawn Camera",
      "Spawn Drawing",
      "Pin Objects",
      "Public"
    ];
    lines.push(header.join("\t"));

    for (let { id, name, description, scene_id, user_data, room_size, allow_promotion } of rooms) {
      const groupOrder = user_data && user_data.group_order;
      const roomOrder = user_data && user_data.room_order;
      const line = [
        id,
        name || "",
        description || "",
        scene_id || "",
        groupOrder || "",
        roomOrder || "",
        room_size || "",
        "false",
        "false",
        "false",
        "false",
        allow_promotion || "true"
      ];
      lines.push(line.join("\t"));
    }

    const tsv = lines.join("\n");

    const blob = new Blob([tsv], { type: "text/tsv" });

    const downloadEl = document.createElement("a");
    downloadEl.download = "room-list.tsv";
    downloadEl.href = URL.createObjectURL(blob);
    downloadEl.click();
  };

  render() {
    return (
      <DialogContainer title="Room Management" {...this.props}>
        <form onSubmit={this.onSubmit}>
          <label htmlFor="room-management-file">Room List (.tsv)</label>
          <input id="room-management-file" type="file" accept=".tsv" multiple={false} ref={this.fileInputRef} />
          <button type="submit">Update Rooms</button>
          <button type="button" onClick={this.onDownloadRoomList}>
            Download Room List
          </button>
        </form>
      </DialogContainer>
    );
  }
}
