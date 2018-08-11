const mediaForMarkerName = {
  problem_room_1_right: "problem_1_with_audio",
  problem_room_1_left: "problem_1_with_picture"
};

const urlsForMedia = {
  problem_1_with_audio: "media/problem_room_1/problem_1_with_audio.mp4",
  problem_1_with_picture: "media/problem_room_1/problem_1_with_picture.mp4"
};

const mediaForZone = {
  problem_room_1: ["problem_1_with_audio", "problem_1_with_picture"]
};

// Return which zones should be active for this player.
const pos = new THREE.Vector3();
const activeZonesForPlayer = function(player, zones) {
  const activeZones = [];
  for (let i = 0; i < zones.length; i++) {
    const zone = zones[i];
    pos.subVectors(player.position, zone.position);
    if (pos.length < 5) {
      activeZones.push(zone);
    }
  }
  return activeZones;
};

// Spawn all the media in the zone
const activateMediaInZone = function(zone) {};

// Despawn all the media in the zone
const deactivateMediaInZone = function(zone) {};

AFRAME.registerComponent("marker", {
  schema: {
    name: { type: "string" }
  },

  init: function() {
//    AFRAME.scenes[0].systems["physics-adventure"].registerMarker(this);
    console.log(this);
  }
});

AFRAME.registerSystem("physics-adventure", {
  init: function() {
    this.zones = [];
    window.setTimeout(() => {
      console.log(this);
      this.player = AFRAME.scenes[0].querySelector("#player-rig").object3D;
    }, 2000);
  },

  registerZone: function(zone) {
    this.zones.push(zone);
  },

  registerMarker: function(marker) {
    this.markers.push(marker);
  },

  tick: function() {
//    if (this.player) {
//      const player = this.player;
//      const activeZones = activeZonesForPlayer(player, this.zones);
//    }
  }
});

/*
    "problem_room_1_left1": {
      "marker": {
        "name": "problem_room_1_left1",
        "relative_url": "media/problem_room_1/errors.png"
      }
    },
    "problem_room_1_left2": {
      "marker": {
        "name": "problem_room_1_left2",
        "relative_url": "media/problem_room_1/five_eqs.jpg"
      }
    },
    "problem_room_1_left3": {
      "marker": {
        "name": "problem_room_1_left3",
        "relative_url": "media/problem_room_1/constant_acc_graphs.png"
      }
    },
    "problem_room_1_right1": {
      "marker": {
        "name": "problem_room_1_right1",
        "relative_url": "media/problem_room_1/errors.png"
      }
    },
    "problem_room_1_right2": {
      "marker": {
        "name": "problem_room_1_right2",
        "relative_url": "media/problem_room_1/five_eqs.jpg"
      }
    },
    "problem_room_1_right3": {
      "marker": {
        "name": "problem_room_1_right3",
        "relative_url": "media/problem_room_1/constant_acc_graphs.png"
      }
    },
    "problem_room_1_solution": {
      "marker": {
        "name": "problem_room_1_solution",
        "relative_url": "media/problem_room_1/solution.mp4"
      }
    },
    "problem_room_2_intro_words": {
      "marker": {
        "name": "problem_room_2_intro_words",
        "relative_url": "media/placeholder.jpg"
      }
    },
    "problem_room_2_intro_picture": {
      "marker": {
        "name": "problem_room_2_intro_picture",
        "relative_url": "media/placeholder.jpg"
      }
    },
    "problem_room_2_left_1": {
      "marker": {
        "name": "problem_room_2_left_1",
        "relative_url": "media/placeholder.jpg"
      }
    },
    "problem_room_2_left_2": {
      "marker": {
        "name": "problem_room_2_left_2",
        "relative_url": "media/placeholder.jpg"
      }
    },
    "problem_room_2_left_3": {
      "marker": {
        "name": "problem_room_2_left_3",
        "relative_url": "media/placeholder.jpg"
      }
    },
    "problem_room_2_left_4": {
      "marker": {
        "name": "problem_room_2_left_4",
        "relative_url": "media/placeholder.jpg"
      }
    },
    "problem_room_2_left_5": {
      "marker": {
        "name": "problem_room_2_left_5",
        "relative_url": "media/placeholder.jpg"
      }
    },
    "problem_room_2_left_6": {
      "marker": {
        "name": "problem_room_2_left_6",
        "relative_url": "media/placeholder.jpg"
      }
    },
    "problem_room_2_left_7": {
      "marker": {
        "name": "problem_room_2_left_7",
        "relative_url": "media/placeholder.jpg"
      }
    },
    "problem_room_2_right_1": {
      "marker": {
        "name": "problem_room_2_right_1",
        "relative_url": "media/placeholder.jpg"
      }
    },
    "problem_room_2_right_2": {
      "marker": {
        "name": "problem_room_2_right_2",
        "relative_url": "media/placeholder.jpg"
      }
    },
    "problem_room_2_right_3": {
      "marker": {
        "name": "problem_room_2_right_3",
        "relative_url": "media/placeholder.jpg"
      }
    },
    "problem_room_2_right_4": {
      "marker": {
        "name": "problem_room_2_right_4",
        "relative_url": "media/placeholder.jpg"
      }
    },
    "problem_room_2_right_5": {
      "marker": {
        "name": "problem_room_2_right_5",
        "relative_url": "media/placeholder.jpg"
      }
    },
    "problem_room_2_right_6": {
      "marker": {
        "name": "problem_room_2_right_6",
        "relative_url": "media/placeholder.jpg"
      }
    },
    "problem_room_2_right_7": {
      "marker": {
        "name": "problem_room_2_right_7",
        "relative_url": "media/placeholder.jpg"
      }
    },
    "problem_room_2_solution": {
      "marker": {
        "name": "problem_room_2_solution",
        "relative_url": "media/placeholder.jpg"
      }
    },
    "problem_room_3_intro_words": {
      "marker": {
        "name": "problem_room_3_intro_words",
        "relative_url": "media/placeholder.jpg"
      }
    },
    "problem_room_3_intro_picture": {
      "marker": {
        "name": "problem_room_3_intro_picture",
        "relative_url": "media/placeholder.jpg"
      }
    },
    "problem_room_3_left_1": {
      "marker": {
        "name": "problem_room_3_left_1",
        "relative_url": "media/placeholder.jpg"
      }
    },
    "problem_room_3_left_2": {
      "marker": {
        "name": "problem_room_3_left_2",
        "relative_url": "media/placeholder.jpg"
      }
    },
    "problem_room_3_left_3": {
      "marker": {
        "name": "problem_room_3_left_3",
        "relative_url": "media/placeholder.jpg"
      }
    },
    "problem_room_3_left_4": {
      "marker": {
        "name": "problem_room_3_left_4",
        "relative_url": "media/placeholder.jpg"
      }
    },
    "problem_room_3_left_5": {
      "marker": {
        "name": "problem_room_3_left_5",
        "relative_url": "media/placeholder.jpg"
      }
    },
    "problem_room_3_left_6": {
      "marker": {
        "name": "problem_room_3_left_6",
        "relative_url": "media/placeholder.jpg"
      }
    },
    "problem_room_3_left_7": {
      "marker": {
        "name": "problem_room_3_left_7",
        "relative_url": "media/placeholder.jpg"
      }
    },
    "problem_room_3_right_1": {
      "marker": {
        "name": "problem_room_3_right_1",
        "relative_url": "media/placeholder.jpg"
      }
    },
    "problem_room_3_right_2": {
      "marker": {
        "name": "problem_room_3_right_2",
        "relative_url": "media/placeholder.jpg"
      }
    },
    "problem_room_3_right_3": {
      "marker": {
        "name": "problem_room_3_right_3",
        "relative_url": "media/placeholder.jpg"
      }
    },
    "problem_room_3_right_4": {
      "marker": {
        "name": "problem_room_3_right_4",
        "relative_url": "media/placeholder.jpg"
      }
    },
    "problem_room_3_right_5": {
      "marker": {
        "name": "problem_room_3_right_5",
        "relative_url": "media/placeholder.jpg"
      }
    },
    "problem_room_3_right_6": {
      "marker": {
        "name": "problem_room_3_right_6",
        "relative_url": "media/placeholder.jpg"
      }
    },
    "problem_room_3_right_7": {
      "marker": {
        "name": "problem_room_3_right_7",
        "relative_url": "media/placeholder.jpg"
      }
    },
    "problem_room_3_solution": {
      "marker": {
        "name": "problem_room_3_solution",
        "relative_url": "media/placeholder.jpg"
      }
    },
    "atrium_center": {
      "audio-marker": {
        "audio": "atrium_bg",
        "type": "play"
      }
    },
    "atrium_entrance_to_mechanics": {
      "audio-marker": {
        "audio": "mechanics_intro_voiceover",
        "type": "play"
      }
    },
    "school_entrance": {
      "audio-marker": [{
        "audio": "mechanics_intro_voiceover",
        "type": "pause"
      },
      {
        "audio": "atrium_bg",
        "type": "pause"}]
    },
    "audio_info": {
      "named-audio-url": [
        {
          "name": "atrium_bg",
          "url": "/media/atrium_bg.ogg"
        },
        {
          "name": "mechanics_intro_voiceover",
          "url": "/media/mechanics_intro_voiceover.ogg"
        }
      ]
    }

    */
