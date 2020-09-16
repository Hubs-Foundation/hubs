import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { InvitePopoverButton } from "./InvitePopover";

export default {
  title: "InvitePopover"
};

const room = {
  url: "hubs.link/oggNnrN",
  code: "478816",
  embed:
    '<iframe src="https://hubs.mozilla.com/oggNnrN/handsome-famous-park?embed_token=5555555555555555555555555" style="width: 1024px; height: 768px;" allow="microphone; camera; vr; speaker;"></iframe>'
};

export const Base = () => (
  <RoomLayout
    toolbarCenter={<InvitePopoverButton url={room.url} code={room.code} embed={room.embed} initiallyVisible />}
  />
);

Base.parameters = {
  layout: "fullscreen"
};
