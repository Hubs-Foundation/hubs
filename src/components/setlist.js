import { getRoomMetadata } from "../room-metadata";
import { getSetTimes } from "../playlist";
import { format } from "date-fns";
import wrap from "word-wrapper";

AFRAME.registerComponent("setlist", {
  schema: {
    room: { type: "string", default: "" },
  },
  init() {
    this.el.object3D.children[0].visible = false; // Assume the first child is the mesh

    this.leftColumn = document.createElement('a-entity');
    this.rightColumn = document.createElement('a-entity');

    const maxLines = 15;

    const totalWrapCount = 20; // Increasing this decreases the size of the text
    const artistWrapCount = 15; // To stop the artist column overlapping with the time column

    // get set times based on playlist info
    const setTimes = getSetTimes(this.data.room);

    var lineCount = 0;
    var artistListStr = "";
    var timeListStr = "";

    for (let {artist, start} of setTimes) {
      if (artist == "~~~dr33m~~~dr33m~~~dr33m~~~") {
        continue;
      }
      const artistStrRaw = artist.toUpperCase();
      const artistStrLines = wrap.lines(artistStrRaw, {width: artistWrapCount});

      if (lineCount + artistStrLines.length < maxLines) {
        artistListStr += artistStrLines.map(x => artistStrRaw.substring(x.start, x.end)).join('\n')+'\n';
        const verticalSpace = '\n'.repeat(artistStrLines.length - 1); // Add newlines before the time so it matches the wrapped artist name
        timeListStr += verticalSpace + format(start, "HH:mm")+'\n';

        lineCount += artistStrLines.length;
      } else {
        break;
      } 
    }

    const shared = {
      baseline: "top",
      wrapCount: totalWrapCount,
      width: 2.0, // seems to fit the box, don't really understand why
      font: "perpetua",
      negate: false,
      color: "#E3FFD9",
      opacity: 0.9,
      lineHeight: 50,
    }
    this.leftColumn.setAttribute('text', {
      value: artistListStr,
      align: "left",
      ...shared
    })
    this.rightColumn.setAttribute('text', {
      value: timeListStr,
      align: "right",
      ...shared
    })

    this.el.appendChild(this.leftColumn);
    this.el.appendChild(this.rightColumn);
  },
  update() {

  },
  tick() {
  }
});
