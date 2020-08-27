import { fetchReticulumAuthenticated } from "./phoenix-utils";
import defaultAvatar from "../assets/models/DefaultAvatar.glb";

import { insanity } from "./insanity";

function chooseRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateRandomName() {
  return `${chooseRandom(insanity)}-${chooseRandom(insanity)}`;
}

export async function fetchRandomDefaultAvatarId() {
  // We give everyone the builtin avatar - ie, eyeball
  return new URL(defaultAvatar, location.href).href;

  // const defaultAvatarEndpoint = "/api/v1/media/search?filter=default&source=avatar_listings";
  // const defaultAvatars = (await fetchReticulumAuthenticated(defaultAvatarEndpoint)).entries;
  // if (defaultAvatars.length === 0) {
  //   // If reticulum doesn't return any default avatars, just default to the duck model. This should only happen
  //   // when running against a fresh reticulum server, e.g. a local ret instance.
  //   return new URL(defaultAvatar, location.href).href;
  // }
  // const avatarIds = defaultAvatars.map(avatar => avatar.id);
  // return chooseRandom(avatarIds);
}
