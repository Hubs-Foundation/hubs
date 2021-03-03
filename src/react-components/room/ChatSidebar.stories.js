import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import {
  ChatMessageGroup,
  ChatSidebar,
  SystemMessage,
  ChatMessageList,
  ChatInput,
  SpawnMessageButton,
  MessageAttachmentButton
} from "./ChatSidebar";
import imgSrc from "../../assets/background.jpg";
import videoSrc from "../../assets/video/home.mp4";

export default {
  title: "Room/ChatSidebar",
  parameters: {
    layout: "fullscreen"
  }
};

export const Base = () => (
  <RoomLayout
    sidebar={
      <ChatSidebar>
        <ChatMessageList>
          <SystemMessage type="join" presence="room" name="Robert" timestamp={Date.now()} />
          <SystemMessage type="join" presence="room" name="Dom" timestamp={Date.now()} />
          <ChatMessageGroup
            sender="Dom"
            timestamp={Date.now()}
            messages={[
              { type: "chat", body: "Hello!" },
              { type: "chat", body: "This is a really long message that should cause a new line." },
              { type: "image", body: { src: imgSrc } }
            ]}
          />
          <ChatMessageGroup
            sent
            sender="Robert"
            timestamp={Date.now()}
            messages={[
              { type: "chat", body: "Hello!" },
              { type: "chat", body: "This is a really long message that should cause a new line." },
              { type: "video", body: { src: videoSrc } },
              { type: "chat", body: "Another message" },
              { type: "chat", body: "One last message" }
            ]}
          />
          <SystemMessage type="join" presence="room" name="John" timestamp={Date.now()} />
          <ChatMessageGroup
            sender="John"
            timestamp={Date.now()}
            messages={[
              { type: "chat", body: "https://mozilla.org" },
              { type: "chat", body: "Test message with url. https://hubs.mozilla.com Best site :point_up:" },
              { type: "chat", body: ":thumbsup:" }
            ]}
          />
          <SystemMessage type="join" presence="room" name="Liv" timestamp={Date.now()} />
          <SystemMessage type="join" presence="room" name="Robin" timestamp={Date.now()} />
          <ChatMessageGroup sender="Liv" timestamp={Date.now()} messages={[{ type: "chat", body: ":clap:" }]} />
          <ChatMessageGroup
            sender="Robin"
            timestamp={Date.now()}
            messages={[{ type: "chat", body: '`console.log("Hello World")`' }]}
          />
          <ChatMessageGroup
            sent
            sender="Robert"
            timestamp={Date.now()}
            messages={[
              { type: "chat", body: "https://mozilla.org" },
              { type: "chat", body: "Test message with url. https://hubs.mozilla.com" }
            ]}
          />
        </ChatMessageList>
        <ChatInput
          afterInput={
            <>
              <MessageAttachmentButton />
              <SpawnMessageButton />
            </>
          }
        />
      </ChatSidebar>
    }
  />
);
