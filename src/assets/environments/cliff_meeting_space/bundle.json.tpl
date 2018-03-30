{
  "name": "cliff_meeting_space",
  "version": "0.1.0",
  "meta": {
    "title": "Cliffside Meeting Space",
    "description": "Enjoy a beautiful vista view while collaborating in Mixed Reality",
    "authors": [
      { "name": "Jim Conrad", "github": "j-conrad" }
    ],
    "images": [
      { "type": "preview-thumbnail", "srcset": "<%= require("./preview-thumbnail.png") %>" }
    ]
  },
  "assets": [
    {
      "name": "space-geometry", "src": "<%= require("./MeetingSpace1_mesh.glb") %>"
    },
    {
      "name": "outdoor-geometry", "src": "<%= require("./OutdoorFacade_mesh.glb") %>"
    },
    {
      "name": "collision", "src": "<%= require("./FloorNav_mesh.glb") %>"
    },
    {
      "name": "cliff-geometry", "src": "<%= require("./CliffVista_mesh.glb") %>"
    }
  ]
}
