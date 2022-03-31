This is a set of random little best practices we have come to endorse over the years. They are examples of things that have often come up in PR reviews or patterns we have started to solidify on. There are plenty of counter examples of these in the codebase, they are probably mostly unintentional. Also, most of these are more suggestions than hard rules.

These pertain mostly to the "in room experince" or "game" code. For best practices in the React UI code, see [UI Best Practices](ui-best-practices.md)

### If a method doesn't use `this` it shouldn't be a method

Prefer a standalone function instead.

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


### Only store things on `this` that are actually persistent state.

If you don't care about the state between frames and are only re-using it for GC reasons (see above point) use temp reusable variables, use a closure or variable defined at the root of the file instead.

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

### if you have a setter/getter that just directly sets/gets a value, consider not having it instead

Don't
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

Do
```js
class Foo {
  constructor() {
    this.val = 1;
  }
}
```

### Avoid unnecessary AFrame components.

AFrame component instantiation can be tricky to deal with. When possible try and limit entities and components to the outer edge of the behavior you are working on. The only things that HAVE to be in components right now things with networked state. Things serialized in a glTF are generally components as well, but that is less of a strict requirement. For everything else, consider if that behavior or state might better live elsewhere. Store state in associative collections. Mutate state in regular functions.

### Avoid repeatedly running querySelectors every frame.

Prefer storing a reference when possible.

don't
```js
AFRAME.registerComponent("bad-example", {
  tick() {
    const timeLabel = this.el.querySelector(".video-time-label");
    timeLabel.setAttribute("text", "value", performance.now());
  }
}
```

do
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


### Don’t fail silently.

Always at least log a warning or error to the console when something unexpected happens
