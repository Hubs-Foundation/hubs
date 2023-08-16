import { makeFlowNodeDefinition, EventEmitter, makeEventNodeDefinition } from "@oveddan-behave-graph/core";
import { definitionListToMap } from "./utils";
import {
  EntityID,
  MediaLoaded,
  MediaRoot,
  MediaVideo,
  MediaVideoData,
  Networked,
  NetworkedVideo,
  Owned
} from "../../bit-components";
import { HubsWorld } from "../../app";
import { findAncestorWithComponent, findChildWithComponent } from "../../utils/bit-utils";
import { addComponent, defineQuery, enterQuery, exitQuery, hasComponent } from "bitecs";
import { MediaVideoUpdateSrcEvent, updateVideoSrc } from "../video-system";

type MediaEventState = {
  emitters: {
    onCreate: EventEmitter<EntityID>;
    onPlay: EventEmitter<EntityID>;
    onPause: EventEmitter<EntityID>;
    onEnd: EventEmitter<EntityID>;
    onDestroy: EventEmitter<EntityID>;
    onMediaEvent: EventEmitter<MediaEventType>;
  };
  listenerCount: number;
};

export const mediaEvents = new Map<EntityID, MediaEventState>();

type MediaEventData = {
  target?: EntityID;
  callback?: (target: EntityID) => void;
};

type MediaEventType = { entity: EntityID; event: string };

export const MediaNodes = definitionListToMap([
  makeEventNodeDefinition({
    typeName: `media/onMediaEvent`,
    category: "Media" as any,
    label: "On Media Event",
    in: {},
    out: {
      create: "flow",
      play: "flow",
      pause: "flow",
      end: "flow",
      destroy: "flow",
      entity: "entity"
    },
    configuration: {
      target: { valueType: "entity" }
    },
    initialState: {} as MediaEventData,
    init: ({ write, commit, configuration, graph }) => {
      const target = configuration["target"] as EntityID;
      if (!target) throw new Error(`media/onMediaEvent must have a target`);

      const callback = (data: any) => {
        const { event, entity } = data;
        if (!event.toLowerCase().includes("stay")) console.log(event, target, data);

        write("entity", entity);
        commit(event);
      };

      if (!mediaEvents.has(target)) {
        mediaEvents.set(target, {
          emitters: {
            onCreate: new EventEmitter<EntityID>(),
            onPlay: new EventEmitter<EntityID>(),
            onPause: new EventEmitter<EntityID>(),
            onEnd: new EventEmitter<EntityID>(),
            onDestroy: new EventEmitter<EntityID>(),
            onMediaEvent: new EventEmitter<MediaEventType>()
          },
          listenerCount: 0
        });
        console.log("Generating media event state for", target, mediaEvents.get(target));
      }

      const mediaState = mediaEvents.get(target)!;
      mediaState.emitters["onMediaEvent"].addListener(callback);
      mediaState.listenerCount++;
      console.log("added listener for", target, mediaState.listenerCount);

      return { target, callback };
    },
    dispose: ({ state: { callback, target }, graph }) => {
      const mediaState = mediaEvents.get(target!)!;
      mediaState.emitters["onMediaEvent"].removeListener(callback as any);
      mediaState.listenerCount--;
      if (mediaState.listenerCount === 0) mediaEvents.delete(target!);
      return {};
    }
  }),
  makeFlowNodeDefinition({
    typeName: "media/mediaPlayback",
    category: "Media" as any,
    label: "Media Playback",
    in: () => [
      { key: "entity", valueType: "entity" },
      { key: "play", valueType: "flow" },
      { key: "pause", valueType: "flow" },
      { key: "setSrc", valueType: "flow" },
      { key: "src", valueType: "string" },
      { key: "setMuted", valueType: "flow" },
      { key: "muted", valueType: "boolean" },
      { key: "setLoop", valueType: "flow" },
      { key: "loop", valueType: "boolean" }
    ],
    initialState: undefined,
    out: { flow: "flow" },
    triggered: ({ read, commit, triggeringSocketName, graph }) => {
      const entity = read("entity") as EntityID;
      const world = graph.getDependency("world") as HubsWorld;

      const media = findChildWithComponent(world, MediaVideo, entity);
      if (media) {
        const video = MediaVideoData.get(media) as HTMLVideoElement;
        if (video) {
          if (triggeringSocketName === "play") {
            video.play();
          } else if (triggeringSocketName === "pause") {
            video.pause();
          } else if (triggeringSocketName === "setSrc") {
            if (!hasComponent(world, MediaVideoUpdateSrcEvent, media)) {
              updateVideoSrc(world, media, read("src") as string, video);
            }
          } else if (triggeringSocketName === "setLoop") {
            video.loop = read("loop") as boolean;
          }
        }
      }
      commit("flow");
    }
  })
]);

function addVideoListeners(world: HubsWorld, eid: EntityID) {
  const mediaRoot = findAncestorWithComponent(world, MediaRoot, eid)!;
  const mediaState = mediaEvents.get(mediaRoot)!;
  if (mediaState) {
    const video = MediaVideoData.get(eid) as HTMLVideoElement;
    const listeners = videoListeners.get(eid)!;
    video.addEventListener("play", listeners.onPlay);
    video.addEventListener("pause", listeners.onPause);
    video.addEventListener("end", listeners.onEnd);
    mediaState.emitters["onMediaEvent"].emit({ entity: mediaRoot, event: "create" });
  }
}

function removeVideoListeners(world: HubsWorld, eid: EntityID) {
  const mediaRoot = findAncestorWithComponent(world, MediaRoot, eid)!;
  const mediaState = mediaEvents.get(mediaRoot)!;
  if (mediaState) {
    const video = MediaVideoData.get(eid) as HTMLVideoElement;
    const listeners = videoListeners.get(eid)!;
    video.removeEventListener("play", listeners.onPlay);
    video.removeEventListener("pause", listeners.onPause);
    video.removeEventListener("end", listeners.onEnd);
    mediaState.emitters["onMediaEvent"].emit({ entity: mediaRoot, event: "destroy" });
  }
}

type VideoListeners = {
  onPlay: EventListener;
  onPause: EventListener;
  onEnd: EventListener;
};

const videoListeners = new Map<EntityID, VideoListeners>();
const mediaQuery = defineQuery([MediaVideo, Networked, NetworkedVideo, MediaLoaded]);
const mediaEnterQuery = enterQuery(mediaQuery);
const mediaExitQuery = exitQuery(mediaQuery);
const mediaVideoSrcUpdatedQuery = defineQuery([MediaVideo, MediaVideoUpdateSrcEvent]);
const mediaVideoSrcUpdatedEnterQuery = enterQuery(mediaVideoSrcUpdatedQuery);
const mediaVideoSrcUpdatedExitQuery = exitQuery(mediaVideoSrcUpdatedQuery);
export function mediaSystem(world: HubsWorld) {
  mediaVideoSrcUpdatedEnterQuery(world).forEach(eid => removeVideoListeners(world, eid));
  mediaVideoSrcUpdatedExitQuery(world).forEach(eid => addVideoListeners(world, eid));

  mediaEnterQuery(world).forEach(eid => {
    const mediaRoot = findAncestorWithComponent(world, MediaRoot, eid)!;
    const mediaState = mediaEvents.get(mediaRoot)!;
    if (mediaState) {
      const listeners = {
        onPlay: (ev: Event) => mediaState.emitters["onMediaEvent"].emit({ entity: mediaRoot, event: "play" }),
        onPause: (ev: Event) => mediaState.emitters["onMediaEvent"].emit({ entity: mediaRoot, event: "pause" }),
        onEnd: (ev: Event) => mediaState.emitters["onMediaEvent"].emit({ entity: mediaRoot, event: "end" })
      };
      videoListeners.set(eid, listeners);
      addVideoListeners(world, eid);
    }
  });

  mediaExitQuery(world).forEach(eid => {
    removeVideoListeners(world, eid);
    videoListeners.delete(eid);
  });
}
