import { Component } from "bitecs";
import { HubsWorld } from "../app";
import {
  $isStringType,
  NetworkedMediaFrame,
  NetworkedTransform,
  NetworkedVideo,
  NetworkedWaypoint
} from "../bit-components";
import { NetworkedMediaFrameSchema } from "./networked-media-frame-schema";
import { NetworkedTransformSchema } from "./networked-transform-schema";
import { NetworkedVideoSchema } from "./networked-video-schema";
import { NetworkedWaypointSchema } from "./networked-waypoint-schema";
import type { CursorBuffer, EntityID } from "./networking-types";

export interface StoredComponent {
  version: number;
  data: any;
}

export interface NetworkSchema {
  componentName: string;
  serialize: (
    world: HubsWorld,
    eid: EntityID,
    data: CursorBuffer,
    isFullSync: boolean,
    writeToShadow: boolean
  ) => boolean;
  deserialize: (world: HubsWorld, eid: EntityID, data: CursorBuffer) => void;
  serializeForStorage: (eid: EntityID) => StoredComponent;
  deserializeFromStorage: (eid: EntityID, storedComponent: StoredComponent) => void;
}

export const schemas: Map<Component, NetworkSchema> = new Map();
schemas.set(NetworkedMediaFrame, NetworkedMediaFrameSchema);
schemas.set(NetworkedTransform, NetworkedTransformSchema);
schemas.set(NetworkedVideo, NetworkedVideoSchema);
schemas.set(NetworkedWaypoint, NetworkedWaypointSchema);

export const networkableComponents = Array.from(schemas.keys());

export function read(prop: any, eid: EntityID) {
  if (ArrayBuffer.isView(prop[eid])) {
    return Array.from(prop[eid]);
  } else {
    return prop[$isStringType] ? APP.getString(prop[eid]) : prop[eid];
  }
}

export function write(prop: any, eid: EntityID, value: any) {
  if (ArrayBuffer.isView(prop[eid])) {
    prop[eid].set(value);
  } else {
    prop[$isStringType] ? APP.getString(value) : value;
  }
}

export type Migration = (storedComponent: StoredComponent) => StoredComponent;
export type ApplyFn = (eid: EntityID, storedComponent: StoredComponent) => boolean;
export function deserializerWithMigrations(migrations: Map<number, Migration>, apply: ApplyFn) {
  return function deserializeFromStorage(eid: EntityID, original: StoredComponent) {
    let migrated = original;
    while (migrations.has(migrated.version)) {
      migrated = migrations.get(migrated.version)!(migrated);
    }

    if (!apply(eid, migrated)) {
      console.error("Failed to deserialize component data.", { original, migrated });
      throw new Error("Failed to deserialize component data.");
    }
  };
}
