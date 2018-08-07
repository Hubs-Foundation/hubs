export const ENVIRONMENT_URLS = [
  process.env.ASSET_BUNDLE_SERVER + "/rooms/meetingroom/MeetingRoom.bundle.json",
  process.env.ASSET_BUNDLE_SERVER + "/rooms/atrium/Atrium.bundle.json",
  process.env.ASSET_BUNDLE_SERVER + "/rooms/MedievalFantasyBook/MedievalFantasyBook.bundle.json",
  process.env.ASSET_BUNDLE_SERVER + "/rooms/rooftopbuilding1/RooftopBuilding1.bundle.json"
];

let defaultEnvironment = ENVIRONMENT_URLS[0];

if (process.env.NODE_ENV === "development" && process.env.TEST_ENVIRONMENT_PATH) {
  // In development allow setting the TEST_ENVIRONMENT_PATH env variable to add a custom environment to the environment picker.
  ENVIRONMENT_URLS.push(window.location.protocol + "//" + window.location.host + "/test-environment" + process.env.TEST_ENVIRONMENT_PATH);
  defaultEnvironment = process.env.TEST_ENVIRONMENT_PATH
}

export const DEFAULT_ENVIRONMENT_URL = defaultEnvironment;
