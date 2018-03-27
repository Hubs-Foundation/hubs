{
  "name": "cliff_meeting_space",
  "version": "0.1.0",
  "meta": {
    "title": "Cliffside Meeting Space",
    "description": "Enjoy a beautiful vista view while collaborating in Mixed Reality",
    "images": [
      { "type": "preview-thumbnail", "srcset": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Big_Buck_Bunny_4K.webm/310px-seek%3D116-Big_Buck_Bunny_4K.webm.jpg" }
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
