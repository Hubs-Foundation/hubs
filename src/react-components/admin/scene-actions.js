import { CREATE, UPDATE } from "react-admin";

function randomString(len) {
  const p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return [...Array(len)].reduce(a => a + p[~~(Math.random() * p.length)], "");
}

export const SCENE_APPROVE_NEW = "SCENE_APPROVE_NEW";
export const sceneApproveNew = scene => ({
  type: SCENE_APPROVE_NEW,
  payload: {
    data: {
      scene_listing_sid: randomString(7),
      scene_id: scene.id,
      slug: scene.slug,
      name: scene.name,
      description: scene.description,
      attributions: scene.attributions,
      tags: { tags: [] },
      model_owned_file_id: scene.model_owned_file_id,
      scene_owned_file_id: scene.scene_owned_file_id,
      screenshot_owned_file_id: scene.screenshot_owned_file_id,
      order: 10000, // Start at end of listings
      state: "active",
      inserted_at: new Date(),
      updated_at: new Date()
    }
  },
  meta: { fetch: CREATE, resource: "scene_listings" }
});

export const SCENE_APPROVE_EXISTING = "SCENE_APPROVE_EXISTING";
export const sceneApproveExisting = scene => ({
  type: SCENE_APPROVE_EXISTING,
  payload: {
    id: scene.scene_listing_id,
    data: {
      name: scene.name,
      description: scene.description,
      attributions: scene.attributions,
      model_owned_file_id: scene.model_owned_file_id,
      scene_owned_file_id: scene.scene_owned_file_id,
      screenshot_owned_file_id: scene.screenshot_owned_file_id,
      updated_at: new Date()
    }
  },
  meta: { fetch: UPDATE, resource: "scene_listings" }
});

export const SCENE_REVIEWED = "SCENE_REVIEWED";
export const sceneReviewed = id => ({
  type: SCENE_REVIEWED,
  payload: {
    id,
    data: { reviewed_at: new Date() }
  },
  meta: {
    fetch: UPDATE,
    resource: "scenes",
    refresh: true
  }
});
