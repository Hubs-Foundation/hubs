function registerNetworkSchemas() {
  NAF.schemas.add({
    template: "#remote-avatar-template",
    components: [
      {
        component: "position",
        dirtyPredicate: {
          type: NAF.PREDICATE_XYZ_ALMOST_EQUALS,
          epsilon: 0.01
        }
      },
      {
        component: "rotation",
        dirtyPredicate: {
          type: NAF.PREDICATE_XYZ_ALMOST_EQUALS,
          epsilon: 1
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
          type: NAF.PREDICATE_XYZ_ALMOST_EQUALS,
          epsilon: 0.01
        }
      },
      {
        selector: ".camera",
        component: "rotation",
        dirtyPredicate: {
          type: NAF.PREDICATE_XYZ_ALMOST_EQUALS,
          epsilon: 1
        }
      },
      {
        selector: ".left-controller",
        component: "position",
        dirtyPredicate: {
          type: NAF.PREDICATE_XYZ_ALMOST_EQUALS,
          epsilon: 0.01
        }
      },
      {
        selector: ".left-controller",
        component: "rotation",
        dirtyPredicate: {
          type: NAF.PREDICATE_XYZ_ALMOST_EQUALS,
          epsilon: 1
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
          type: NAF.PREDICATE_XYZ_ALMOST_EQUALS,
          epsilon: 0.01
        }
      },
      {
        selector: ".right-controller",
        component: "rotation",
        dirtyPredicate: {
          type: NAF.PREDICATE_XYZ_ALMOST_EQUALS,
          epsilon: 1
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
          type: NAF.PREDICATE_XYZ_ALMOST_EQUALS,
          epsilon: 0.01
        }
      },
      {
        component: "rotation",
        dirtyPredicate: {
          type: NAF.PREDICATE_XYZ_ALMOST_EQUALS,
          epsilon: 1
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
          type: NAF.PREDICATE_XYZ_ALMOST_EQUALS,
          epsilon: 0.01
        }
      },
      {
        component: "rotation",
        dirtyPredicate: {
          type: NAF.PREDICATE_XYZ_ALMOST_EQUALS,
          epsilon: 1
        }
      },
      "scale"
    ]
  });
}

export default registerNetworkSchemas;
