This is a set of random little best practices we have come to endorse over the years. They are examples of things that have often come up in PR reviews or patterns we have started to solidify on. There are plenty of counter examples of these in the codebase, they are probably mostly unintentional. Also, most of these are more suggestions than hard rules.

These pertain mostly to the "in room experience" or "engine" code. For best practices in the React UI code, see [UI Best Practices](ui-best-practices.md)

## Avoid Misdirection
### if you have a setter/getter that just directly sets/gets a value, consider not having it instead

This avoids an extra layer of indirection and makes the code easier to interpret. If the goal is "in case we need to do other things when this changes later", see [YAGNI](https://en.wikipedia.org/wiki/You_aren%27t_gonna_need_it). Setters and getters also have added overhead in javascript vs raw values.

Don't:
```js
class Foo {
  constructor() {
    this._val = 1;
  }
    
  get val() {
      return this._val;
  }

  set val(newVal) {
      this._val = newVal;
  }
}
```

Do:
```js
class Foo {
  constructor() {
    this.val = 1;
  }
}
```


### If a method doesn't use `this` it shouldn't be a method

Prefer a standalone function instead. Doing so instantly lets the reader know they don't have to be looking for some hidden state.

Don't:
```js
class Foo {
  plusOne(x) {
    return x + 1;
  }
  bar() {
    console.log(this.plusOne(3));
  }
}
```


Do:
```js
function plusOne(x) {
  return x + 1;
}
class Foo {
  bar() {
    console.log(plusOne(3));
  }
}
```


### Only store things on `this` that are actually persistent state.

If you don't care about the state between frames and are only re-using it for [GC reasons](#dont-allocate-objects-every-frame)  use a closure or variable defined at the root of the file instead.

Don't:
```js
const INCREMENT_THRESHOLD = 1000;
class Foo {
  constructor() {
    this.lastIncrement = Date.now();
    this.tempVec = new THREE.Vector3()
  }
  tick() {
    if (Date.now() - this.lastIncrement > INCREMENT_THRESHOLD) {
      this.tempVec.set(1,2,3);
      this.tempVec.add(4,5,6);
      console.log(this.tempVec);
      this.lastIncrement = Date.now();
    }
  }
}
```

Do:
```js
const INCREMENT_THRESHOLD = 1000;
class Foo {
  constructor() {
    this.lastIncrement = Date.now();
  }
  tick: (function() {
    const tempVec = new THREE.Vector3()
    return function() {
      if (Date.now() - this.lastIncrement > INCREMENT_THRESHOLD) {
        tempVec.set(1,2,3);
        tempVec.add(4,5,6);
        console.log(tempVec);
        this.lastIncrement = Date.now();
      }
    }
  })()
}
```

### Prefer calling functions to emitting events

Events obfuscate code flow and coupling and should only be used when the emitter of the event is truly decoupled from things wishing ot subscribe to the event. Prefer direct function calls when the emitter and subscriber are inherently coupled.

Don't:
```js
function onKeyDown(e)
  clearTimeout(keyTimout);
  keyTimout = setTimeout(() => scene.emit("action_typing_ended"), 500);
  scene.emit("action_typing_started");
} 

scene.addEventListener("action_typing_started", () => window.APP.hubChannel.beginTyping());
scene.addEventListener("action_typing_ended", () => window.APP.hubChannel.endTyping());
``` 

Do:
```js
function onKeyDown(e)
  clearTimeout(keyTimout);
  keyTimout = setTimeout(() => window.APP.hubChannel.endTyping(), 500);
  window.APP.hubChannel.beginTyping()
} 
``` 

### Don’t fail silently.

Always at least log a warning or error to the console when something unexpected happens

### Avoid defensive coding

Related to no failing silently; Do not guard against conditions that should not occur or indicate problems that are the responsibility of some other code. Adding unnecessary guards will force future readers of the code to have to try and figure out what cases that guard is intending to handle. Also, as with failing silently, unnecessary guards can lead to masking of serious issues.


Don't:
```js
if(window.APP && window.APP.shouldAlwaysExist && window.APP.shouldAlwaysExist.doSomething) {
  window.APP.shouldAlwaysExist.doSomething();
}
``` 

Do:
```js
window.APP.shouldAlwaysExist.doSomething();
``` 


### Prefer timestamps to timeouts

Prefer saving and comparing timestamps to using `setTimeout`, especially for code that is already running in a tick loop. This allows for a much more predictable code flow.

Don't:
```js

tick() {
  if (this.canDoThingNow && userinput.get(DO_THING_PATH)) {
    this.canDoThingNow = false;
    doThing();
    setTimeout(() => {
      this.canDoThingNow = true;
    }, DO_THING_COOLDOWN);
  }
}

```

Do:
```js

tick(time) {
  if (time > this.lastDidThing + DO_THING_COOLDOWN && userinput.get(DO_THING_PATH)) {
    this.lastDidThing = time;
    doThing();
  }
}

```


## Avoid aframe's pitfalls
### Avoid unnecessary AFrame components and entities

AFrame component instantiation can be tricky to deal with. When possible try and limit entities and components to the outer edge of the behavior you are working on. The only things that HAVE to be in components right now things with networked state. Things serialized in a glTF are generally components as well, but that is less of a strict requirement. For everything else, consider if that behavior or state might better live elsewhere. Store state in associative collections. Mutate state in regular functions. Also, consider setting up object hierarchies directly in a function using ThreeJS objects rather than in hub.html.

### Avoid repeatedly running querySelectors every frame.

Prefer storing a reference when possible.

Don't:
```js
AFRAME.registerComponent("bad-example", {
  tick() {
    const timeLabel = this.el.querySelector(".video-time-label");
    timeLabel.setAttribute("text", "value", performance.now());
  }
}
```

Do:
```js
AFRAME.registerComponent("bad-example", {
  init() {
    this.timeLabel = this.el.querySelector(".video-time-label");
  }
  tick() {
    this.timeLabel.setAttribute("text", "value", performance.now());
  }
}
```


### Avoid using aframe's THREE property components

Do not use aframe's `position`, `rotation`, `scale`, or `visible` components, and instead just directly modify the Object3D properties. These add an additional layer of indirection and performance overhead.

Don't:
```js
el.setAttribute("visible", false);
el.setAttribute("position", {x: 0, y: 1, z: 0});
```

Do:
```js
el.object3D.visible = false;
el.object3D.position.set(0,1,0);
```

### Prefer storing Object3D references to aframe entities

As we continue to work to phase out our use of aframe we should prefer storing things in terms of Object3D references rather than aframe entity references. This is especially true if we only ever use the entity reference to get at the Object3D (which can often be the case when abiding by the above point). If the reference is heavily being used to access aframe functionality then it may make sense to keep as an entity reference. By convention all entity references should have the `El` suffix.

Don't:
```js
const head = document.querySelector("#avatar-head");
head.object3D.visible = false;
head.object3D.position.set(0,1,0);
head.setAttribute("some-component", "value");

const onlyUsingAframe = document.querySelector("#foo");
onlyUsingAframe.setAttribute("some-component", "value");
console.log(onlyUsingAframe.components["some-component"].data.value);
```

Do:
```js
const head = document.querySelector("#avatar-head").object3D;
head.visible = false;
head.position.set(0,1,0);
head.el.setAttribute("some-component", "value");

const onlyUsingAframeEl = document.querySelector("#foo");
onlyUsingAframeEl.setAttribute("some-component", "value");
console.log(onlyUsingAframeEl.components["some-component"].data.value);
```

## Avoid JS pitfalls
### Don't allocate objects every frame.

If you see `new` in a tick function, you should be suspicious. This is especially common for ThreeJS objects like Vectors, Quaternions, and Matrices, try to re-use them instead to avoid GC. If you find yourself allocating a whole bunch of something, consider using a pool.

Don't:
```js
AFRAME.registerComponent("bad-example", {
  tick(dt) {
    const tempVec = new THREE.Vector3();
    this.el.object3D.getWorldPosition(tempVec);
    // do something with tempVec
  }
}
```

Do:
```js
AFRAME.registerComponent("example", {
  tick: (function {
    const tempVec = new THREE.Vector3();
    return function(dt) {
      this.el.object3D.getWorldPosition(tempVec);
      // do something with tempVec
    };
  })()
}
```

or

```js
const tempVec = new THREE.Vector3(1, 2, 3);

AFRAME.registerComponent("example", {
  tick() {
    this.el.object3D.getWorldPosition(tempVec);
    // do something with tempVec
  }
}
```

  
