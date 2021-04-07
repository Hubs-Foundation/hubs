import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import {
  ChatMessageGroup,
  ChatSidebar,
  SystemMessage,
  ChatMessageList,
  ChatInput,
  SpawnMessageButton,
  MessageAttachmentButton,
  EmojiPickerPopoverButton
} from "./ChatSidebar";
import imgSrc from "../../assets/background.jpg";
import videoSrc from "../../assets/video/home.mp4";

export default {
  title: "Room/ChatSidebar",
  parameters: {
    layout: "fullscreen"
  }
};

const nextTimestamp = (function() {
  const now = Date.now();
  let time = now - 8 * 60 * 60 * 1000;
  return function nextTimeStamp() {
    time = time + (now - time) / 2.0;
    return time;
  };
})();

export const Base = () => (
  <RoomLayout
    sidebar={
      <ChatSidebar>
        <ChatMessageList>
          <SystemMessage type="join" presence="room" name="Robert" timestamp={nextTimestamp()} />
          <SystemMessage type="join" presence="room" name="Dom" timestamp={nextTimestamp()} />
          <ChatMessageGroup
            sender="Dom"
            timestamp={nextTimestamp()}
            messages={[
              { type: "chat", body: "Hello!" },
              { type: "chat", body: "This is a really long message that should cause a new line." },
              { type: "image", body: { src: imgSrc } }
            ]}
          />
          <ChatMessageGroup
            sent
            sender="Robert"
            timestamp={nextTimestamp()}
            messages={[
              { type: "chat", body: "Hello!" },
              { type: "chat", body: "This is a really long message that should cause a new line." },
              { type: "video", body: { src: videoSrc } },
              { type: "chat", body: "Another message" },
              { type: "chat", body: "One last message" }
            ]}
          />
          <SystemMessage type="join" presence="room" name="John" timestamp={nextTimestamp()} />
          <ChatMessageGroup
            sender="John"
            timestamp={nextTimestamp()}
            messages={[
              { type: "chat", body: "https://mozilla.org" },
              { type: "chat", body: "Test message with url. https://hubs.mozilla.com Best site :point_up:" },
              { type: "chat", body: ":thumbsup:" }
            ]}
          />
          <SystemMessage type="join" presence="room" name="Liv" timestamp={nextTimestamp()} />
          <SystemMessage type="join" presence="room" name="Robin" timestamp={nextTimestamp()} />
          <ChatMessageGroup sender="Liv" timestamp={nextTimestamp()} messages={[{ type: "chat", body: ":clap:" }]} />
          <ChatMessageGroup
            sender="Robin"
            timestamp={nextTimestamp()}
            messages={[{ type: "chat", body: '`console.log("Hello World")`' }]}
          />
          <ChatMessageGroup
            sent
            sender="Robert"
            timestamp={nextTimestamp()}
            messages={[
              { type: "chat", body: "https://mozilla.org" },
              { type: "chat", body: "Test message with url. https://hubs.mozilla.com" }
            ]}
          />
        </ChatMessageList>
        <ChatInput
          afterInput={
            <>
              <EmojiPickerPopoverButton onSelectEmoji={emoji => console.log(emoji)} />
              <MessageAttachmentButton />
              <SpawnMessageButton />
            </>
          }
        />
      </ChatSidebar>
    }
  />
);
