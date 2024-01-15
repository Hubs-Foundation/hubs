import { Not, defineQuery, enterQuery, exitQuery } from "bitecs";
import { HubsWorld } from "../app";
import { Deleting, MediaLoaded, MediaLoader, MediaLoading, Networked } from "../bit-components";
import { SOUND_MEDIA_LOADED, SOUND_MEDIA_LOADING } from "../systems/sound-effects-system";

const loadingSounds = new Map();
const mediaLoadingQuery = defineQuery([Networked, MediaLoader, MediaLoading, Not(Deleting)]);
const mediaLoadingEnterQuery = enterQuery(mediaLoadingQuery);
const mediaLoadingExitQuery = exitQuery(mediaLoadingQuery);
const mediaLoadedQuery = defineQuery([MediaLoaded]);
const mediaLoadedEnterQuery = enterQuery(mediaLoadedQuery);
const mediaLoadedExitQuery = exitQuery(mediaLoadedQuery);
export function sfxMediaSystem(world: HubsWorld, sfxSystem: any) {
  mediaLoadingExitQuery(world).forEach(eid => {
    if (loadingSounds.has(eid)) {
      sfxSystem.stopPositionalAudio(loadingSounds.get(eid));
      loadingSounds.delete(eid);
    }
  });
  mediaLoadingEnterQuery(world).forEach(eid => {
    if (loadingSounds.has(eid)) {
      sfxSystem.stopPositionalAudio(loadingSounds.get(eid));
      loadingSounds.delete(eid);
    }
    if (Networked.owner[eid] === APP.getSid(NAF.clientId)) {
      const obj = world.eid2obj.get(eid);
      const audio = sfxSystem.playPositionalSoundFollowing(SOUND_MEDIA_LOADING, obj, true);
      loadingSounds.set(eid, audio);
    }
  });
  mediaLoadedExitQuery(world).forEach(eid => {
    if (loadingSounds.has(eid)) {
      sfxSystem.stopPositionalAudio(loadingSounds.get(eid));
      loadingSounds.delete(eid);
    }
  });
  mediaLoadedEnterQuery(world).forEach(eid => {
    if (loadingSounds.has(eid)) {
      sfxSystem.stopPositionalAudio(loadingSounds.get(eid));
      loadingSounds.delete(eid);
    }
    const obj = world.eid2obj.get(eid);
    const audio = sfxSystem.playPositionalSoundFollowing(SOUND_MEDIA_LOADED, obj, false);
    loadingSounds.set(eid, audio);
  });
}
