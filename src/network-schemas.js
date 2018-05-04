function registerNetworkSchemas() {
  const xyzNotAlmostEqual = "xyzNotAlmostEqual";
  const positionEpsilon = 0.01;
  const rotationEpsilon = 1;

  NAF.schemas.registerDirtyPredicate(xyzNotAlmostEqual, (v, w, options) => {
    const epsilon = options.epsilon;
    return Math.abs(v.x - w.x) > epsilon || Math.abs(v.z - w.z) > epsilon || Math.abs(v.y - w.y) > epsilon;
  });

  NAF.schemas.add({
    template: "#remote-avatar-template",
    components: [
      {
        component: "position",
        dirtyPredicate: {
          name: xyzNotAlmostEqual,
          options: {
            epsilon: positionEpsilon
          }
        }
      },
      {
        component: "rotation",
        dirtyPredicate: {
          name: xyzNotAlmostEqual,
          options: {
            epsilon: rotationEpsilon
          }
        },
        lerp: false
      },
      "scale",
      "player-info",
      "networked-avatar",
      {
        selector: ".camera",
        component: "position",
        dirtyPredicate: {
          name: xyzNotAlmostEqual,
          options: {
            epsilon: positionEpsilon
          }
        }
      },
      {
        selector: ".camera",
        component: "rotation",
        dirtyPredicate: {
          name: xyzNotAlmostEqual,
          options: {
            epsilon: rotationEpsilon
          }
        }
      },
      {
        selector: ".left-controller",
        component: "position",
        dirtyPredicate: {
          name: xyzNotAlmostEqual,
          options: {
            epsilon: positionEpsilon
          }
        }
      },
      {
        selector: ".left-controller",
        component: "rotation",
        dirtyPredicate: {
          name: xyzNotAlmostEqual,
          options: {
            epsilon: rotationEpsilon
          }
        }
      },
      {
        selector: ".left-controller",
        component: "visible"
      },
      {
        selector: ".right-controller",
        component: "position",
        dirtyPredicate: {
          name: xyzNotAlmostEqual,
          options: {
            epsilon: positionEpsilon
          }
        }
      },
      {
        selector: ".right-controller",
        component: "rotation",
        dirtyPredicate: {
          name: xyzNotAlmostEqual,
          options: {
            epsilon: rotationEpsilon
          }
        }
      },
      {
        selector: ".right-controller",
        component: "visible"
      }
    ]
  });

  NAF.schemas.add({
    template: "#video-template",
    components: [
      {
        component: "position",
        dirtyPredicate: {
          name: xyzNotAlmostEqual,
          options: {
            epsilon: positionEpsilon
          }
        }
      },
      {
        component: "rotation",
        dirtyPredicate: {
          name: xyzNotAlmostEqual,
          options: {
            epsilon: rotationEpsilon
          }
        }
      },
      "visible"
    ]
  });

  NAF.schemas.add({
    template: "#interactable-template",
    components: [
      {
        component: "position",
        dirtyPredicate: {
          name: xyzNotAlmostEqual,
          options: {
            epsilon: positionEpsilon
          }
        }
      },
      {
        component: "rotation",
        dirtyPredicate: {
          name: xyzNotAlmostEqual,
          options: {
            epsilon: rotationEpsilon
          }
        }
      },
      "scale"
    ]
  });
}

export default registerNetworkSchemas;
