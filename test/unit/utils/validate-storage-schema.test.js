import test from "ava";
import validate from "../../../src/storage/validate.js";

function isString(value) {
  return typeof value === "string" || value instanceof String;
}

function isBoolean(value) {
  return typeof value === "boolean" || value instanceof Boolean;
}

test("validate local storage schema", t => {

  t.notThrows(() => validate("foo", isString));
  t.throws(() => validate({}, isString));
  t.throws(() => validate("foo", isBoolean));

  const exampleSchema = {
    profile: {
      displayName: isString,
      avatarId: isString,
    },
    settings: {
      isBot: isBoolean
    },
    confirmedDiscordRooms: [isString],
    uploadPromotionTokens: [{ fileId: isString, promotionToken: isString }]
  };

  t.notThrows(() => validate({
    profile: { displayName: "Marshall", avatarId: new String("some-avatar-id") },
    settings: { isBot: false },
    confirmedDiscordRooms: ["foo", "bar"],
    uploadPromotionTokens: []
  }, exampleSchema));

  t.notThrows(() => validate({
    profile: {},
    settings: {},
    confirmedDiscordRooms: [],
    uploadPromotionTokens: []
  }, exampleSchema));

  t.throws(() => validate({
    profile: { avatarId: 41234 },
    settings: {},
    confirmedDiscordRooms: [],
    uploadPromotionTokens: []
  }, exampleSchema));

  t.throws(() => validate({
    profile: { displayName: "John" },
    settings: { isBot: true },
    confirmedDiscordRooms: ["general"],
    uploadPromotionTokens: [{ fileId: "whiz", promotionToken: 94329 }]
  }, exampleSchema));

  t.throws(() => validate({
    profile: { displayName: "John Bot" },
    settings: { isBot: "true" },
    confirmedDiscordRooms: [],
    uploadPromotionTokens: []
  }, exampleSchema));
});
