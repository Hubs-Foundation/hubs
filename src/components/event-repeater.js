AFRAME.registerComponent("event-repeater", {
  schema: {
    target: {type: "selector"},
    events: {type: "array"}
  },

  init: function() {
  	let events = this.data.events;
  	for (let i = 0; i < events.length; i++) {
  		this.data.target.addEventListener(events[i], e => {
  			this.el.emit(events[i], e.details);
  		});
  	}
  }

});