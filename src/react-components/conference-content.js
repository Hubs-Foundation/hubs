import React from "react";
import styles from "../assets/stylesheets/conference-content.scss";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers } from "@fortawesome/free-solid-svg-icons/faUsers";
import configs from "../utils/configs";
import { createAndRedirectToNewHub } from "../utils/phoenix-utils";

const maxRoomCap = configs.feature("max_room_cap") || 50;

function groupFeaturedRooms(featuredRooms) {
  if (!featuredRooms) {
    return [];
  }

  let groups = [];

  for (const room of featuredRooms) {
    const parts = room.name.split(" | ");

    if (parts.length === 2) {
      const [groupName, roomName] = parts;

      let group = groups.find(g => g.name === groupName);

      if (group) {
        group.rooms.push({ ...room, name: roomName });
      } else {
        groups.push({
          name: groupName,
          rooms: [{ ...room, name: roomName }],
          user_data: room.user_data
        });
      }
    } else {
      groups.push({
        name: room.name,
        rooms: [room],
        user_data: room.user_data
      });
    }
  }

  groups = groups.sort((a, b) => {
    if (a.user_data && a.user_data.group_order !== undefined && b.user_data && b.user_data.group_order !== undefined) {
      return a.user_data.group_order - b.user_data.group_order;
    }

    if (a.user_data && a.user_data.group_order !== undefined) {
      return -1;
    }

    if (b.user_data && b.user_data.group_order !== undefined) {
      return 1;
    }

    return 0;
  });

  for (const group of groups) {
    group.rooms = group.rooms.sort((a, b) => {
      if (a.user_data && a.user_data.room_order !== undefined && b.user_data && b.user_data.room_order !== undefined) {
        return a.user_data.room_order - b.user_data.room_order;
      }

      if (a.user_data && a.user_data.room_order !== undefined) {
        return -1;
      }

      if (b.user_data && b.user_data.room_order !== undefined) {
        return 1;
      }

      return 0;
    });

    const mainRoom = group.rooms[0];
    group.description = mainRoom.description;
    group.thumbnail = mainRoom.images && mainRoom.images.preview && mainRoom.images.preview.url;
  }

  return groups;
}

function RoomItem({ room }) {
  let canSpectate = true;
  let canJoin = true;

  if (room.member_count + room.lobby_count >= maxRoomCap) {
    canSpectate = false;
  }

  if (room.member_count >= room.room_size) {
    canJoin = false;
  }

  return (
    <li key={room.id}>
      <p className={styles.roomTitle}>{room.name}</p>
      <span>
        <FontAwesomeIcon icon={faUsers} />
        <b>{`${room.member_count} / ${room.room_size}`}</b>
        {canSpectate ? (
          <a className={classNames(styles.joinButton)} href={room.url}>
            {canJoin ? "Join" : "Spectate"}
          </a>
        ) : (
          <p className={classNames(styles.joinButton, styles.joinButtonDisabled)}>Full</p>
        )}
      </span>
    </li>
  );
}

function ConferenceRoomGroup({ group }) {
  return (
    <div className={classNames(styles.card, styles.conferenceRoomGroup)}>
      <div className={styles.groupLeft}>
        <h2>{group.name}</h2>
        {group.description && <p>{group.description}</p>}
        <ul className={styles.roomList}>{group.rooms.map(room => <RoomItem key={room.id} room={room} />)}</ul>
      </div>
      <div className={styles.groupRight}>
        <img alt={group.name} src={group.thumbnail} />
      </div>
    </div>
  );
}

export default function ConferenceContent({ publicRooms, favoritedRooms }) {
  return (
    <main className={styles.conferenceContent}>
      <section className={styles.descriptionContainer}>
        <div className={styles.contentContainer}>
          <div className={classNames(styles.card, styles.centered)}>
            <img className={styles.logo} src={configs.image("logo")} />
            <h1>Welcome to IEEEVR 2020 Online</h1>
            <p>
              <b>Step 1:</b> If you are not registered, you cannot attend in Hubs or join the conference Slack. You may
              still watch the twitch streams. Links and information are available at{" "}
              <a href="http://ieeevr.org/2020/online/" target="_blank" rel="noopener noreferrer">
                http://ieeevr.org/2020/online/
              </a>
            </p>
            <p>
              <b>Step 2:</b> Join the IEEE VR 2020 Slack by entering your registration email{" "}
              <a href="https://ieeevr-slack-invite.glitch.me/" target="_blank" rel="noopener noreferrer">
                here
              </a>.
            </p>
            <p>
              <b>Step 3:</b> If you have not yet tried Hubs, go to one of the Tutorial rooms below: volunteers will
              assist you.{" "}
              <a href="http://ieeevr.org/2020/online/" target="_blank" rel="noopener noreferrer">
                http://ieeevr.org/2020/online/
              </a>{" "}
              also has a collection FAQs, links to tutorial videos, and other information you may find useful.
            </p>
            <p>
              <b>Step 4:</b> Put on your headphones. Echo and feedback will ruin the experience for everyone!
            </p>
            <p>
              <b>Step 5:</b> Ready to attend a session? Consult the{" "}
              <a href="http://ieeevr.org/2020/program/overview.html" target="_blank" rel="noopener noreferrer">
                program
              </a>{" "}
              and the{" "}
              <a href="http://ieeevr.org/2020/program/bof.html" target="_blank" rel="noopener noreferrer">
                Birds-of-a-Feather/Social Schedule
              </a>. The proceedings are also available for download{" "}
              <a href="https://conferences.computer.org/vr-tvcg/2020/#!/home" target="_blank" rel="noopener noreferrer">
                here
              </a>{" "}
              (Note: Firefox will complain about this link because the server uses an out-of-date version of TLS).
            </p>
            <p>
              <b>Step 6:</b> For BOFs, go to the room linked from the BOF schedule. For the regular program, choose one
              of the rooms for your track below. You can see how many people are in a room, and how many it holds; if
              you are on a lower powered device or slow internet connection, consider joining one of the smaller rooms
              (only join one of the multi-stream rooms on a high end desktop or laptop).
            </p>
            <p>
              Finally, please remember that this is a professional event, and you should abide by the{" "}
              <a href="http://ieeevr.org/2020/attend/codeofconduct.html" target="_blank" rel="noopener noreferrer">
                IEEE Code of Conduct
              </a>, as if you were physically at the conference in Atlanta. If you see things you don’t feel are
              appropriate, please reach out to us on the Slack (#issues-and-concerns channel or DM’ing one of the
              conference chairs) or email <a href="mailto:general2020@ieeevr.org">general2020@ieeevr.org</a>. We will
              have a no tolerance policy for inappropriate behavior.
            </p>
          </div>
        </div>
      </section>
      <section>
        <div className={styles.contentContainer}>
          {favoritedRooms &&
            favoritedRooms.length > 0 && (
              <div className={styles.centered}>
                <h1>Favorite Rooms</h1>
                {groupFeaturedRooms(favoritedRooms).map(group => (
                  <ConferenceRoomGroup key={group.name} group={group} />
                ))}
              </div>
            )}
          <div className={styles.centered}>
            <h1>Virtual Rooms</h1>
          </div>
          {groupFeaturedRooms(publicRooms).map(group => <ConferenceRoomGroup key={group.name} group={group} />)}
          <button
            className={classNames(styles.joinButton, styles.createRoomButton)}
            onClick={e => {
              e.preventDefault();
              createAndRedirectToNewHub(null, null, false);
            }}
          >
            Create Room
          </button>
        </div>
      </section>
    </main>
  );
}
