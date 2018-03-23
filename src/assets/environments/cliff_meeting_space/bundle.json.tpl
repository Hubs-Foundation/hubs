{
  "name": "cliff_meeting_space",
  "version": "0.1.0",
  "layers": [
    {
      "name": "space-geometry",
      "assets": [
        { "name": "meeting-space", "src": "<%= require("./MeetingSpace1_mesh.glb") %>" }
      ]
    },
    {
      "name": "outdoor-geometry",
      "assets": [
        { "name": "outdoor-facade", "src": "<%= require("./OutdoorFacade_mesh.glb") %>" }
      ]
    },
    {
      "name": "collision",
      "assets": [
        { "name": "floor-nav", "src": "<%= require("./FloorNav_mesh.glb") %>" }
      ]
    },
    {
      "name": "cliff-geometry",
      "assets": [
        { "name": "cliff-vista", "src": "<%= require("./CliffVista_mesh.glb") %>" }
      ]
    }
  ]
}
