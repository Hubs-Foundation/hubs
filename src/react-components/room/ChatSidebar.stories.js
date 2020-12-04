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
  title: "ChatSidebar"
};

export const Base = () => (
  <RoomLayout
    sidebar={
      <ChatSidebar>
        <ChatMessageList>
          <SystemMessage type="log" body="Robert joined the room" timestamp={Date.now()} />
          <SystemMessage type="log" body="Dom joined the room" timestamp={Date.now()} />
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
          <SystemMessage type="log" body="John joined the room" timestamp={Date.now()} />
          <ChatMessageGroup
            sender="John"
            timestamp={Date.now()}
            messages={[
              { type: "chat", body: "https://mozilla.org" },
              { type: "chat", body: "Test message with url. https://hubs.mozilla.com Best site :point_up:" },
              { type: "chat", body: ":thumbsup:" }
            ]}
          />
          <SystemMessage type="log" body="Liv joined the room" timestamp={Date.now()} />
          <SystemMessage type="log" body="Robin joined the room" timestamp={Date.now()} />
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

Base.parameters = {
  layout: "fullscreen"
};
