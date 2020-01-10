import test from "ava";
import { getSanitizedComponentMapping } from "../../../src/utils/component-mappings";

test("getSanitizedComponentMapping", t => {
  const publicComponents = {
    video: {
      mappedComponent: "video-pause-state",
      publicProperties: {
        paused: {
          mappedProperty: "pausedVideo",
          getMappedValue(value) {
            return !!value;
          }
        }
      }
    }
  };

  const { mappedComponent, mappedProperty, getMappedValue } = getSanitizedComponentMapping(
    "video",
    "paused",
    publicComponents
  );

  t.is(mappedComponent, "video-pause-state");
  t.is(mappedProperty, "pausedVideo");
  t.is(getMappedValue(true), true);
  t.is(getMappedValue(false), false);
  t.is(getMappedValue(null), false);

  // Non public component should throw.
  t.throws(() => {
    getSanitizedComponentMapping("gltf-model-plus", "src", publicComponents);
  });

  // Non public property should throw.
  t.throws(() => {
    getSanitizedComponentMapping("video", "src", publicComponents);
  });
});
