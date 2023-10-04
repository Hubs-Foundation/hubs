import {
  AsyncNode,
  Engine,
  IGraphApi,
  makeFlowNodeDefinition,
  makeInNOutFunctionDesc,
  NodeDescription,
  NodeDescription2,
  Socket,
  ValueType
} from "@oveddan-behave-graph/core";
import {
  AdditiveAnimationBlendMode,
  AnimationAction,
  AnimationClip,
  LoopOnce,
  LoopRepeat,
  NormalAnimationBlendMode
} from "three";
import { HubsWorld } from "../../app";
import {
  BehaviorGraph,
  MixerAnimatableData,
  NetworkedAnimation,
  NetworkedAnimationAction,
  ObjectAnimationActionData,
  Networked,
  Owned,
  BitAnimationAction
} from "../../bit-components";
import { EntityID } from "../../utils/networking-types";
import { definitionListToMap } from "./utils";
import { addComponent, addEntity, defineQuery, exitQuery, hasComponent, removeEntity } from "bitecs";
import { takeOwnership } from "../../utils/take-ownership";
import { takeSoftOwnership } from "../../utils/take-soft-ownership";
import { setInitialNetworkedData } from "../../utils/assign-network-ids";

export const ANIMATION_FLAGS = {
  RUNNING: 1 << 0,
  PAUSED: 1 << 1,
  LOOP: 1 << 2,
  CLAMP_WHEN_FINISHED: 1 << 3,
  ADDITIVE_BLENDING: 1 << 4
};

export const animationValueDefs = {
  animationAction: new ValueType(
    "animationAction",
    () => null,
    (value: AnimationAction) => value,
    (value: AnimationAction) => value,
    (start: AnimationAction, _end: AnimationAction, _t: number) => start
  )
};

function action2Component(world: HubsWorld, eid: EntityID, action: AnimationAction) {
  let flags = 0;
  if (action.clampWhenFinished) flags |= ANIMATION_FLAGS.CLAMP_WHEN_FINISHED;
  if (action.blendMode === AdditiveAnimationBlendMode) flags |= ANIMATION_FLAGS.ADDITIVE_BLENDING;
  if (action.loop === LoopRepeat) flags |= ANIMATION_FLAGS.LOOP;
  if (action.isRunning()) flags |= ANIMATION_FLAGS.RUNNING;
  if (action.paused) flags |= ANIMATION_FLAGS.PAUSED;

  BitAnimationAction.flags[eid] = flags;
  BitAnimationAction.time[eid] = action.time;
  BitAnimationAction.timeScale[eid] = action.timeScale;
  BitAnimationAction.weight[eid] = action.weight;

  NetworkedAnimationAction.flags[eid] = flags;
  NetworkedAnimationAction.time[eid] = action.time;
  NetworkedAnimationAction.timeScale[eid] = action.timeScale;
  NetworkedAnimationAction.weight[eid] = action.weight;
}

function component2Action(world: HubsWorld, eid: EntityID, action: AnimationAction) {
  if (BitAnimationAction.flags[eid] !== NetworkedAnimationAction.flags[eid]) {
    if (
      (BitAnimationAction.flags[eid] & ANIMATION_FLAGS.CLAMP_WHEN_FINISHED) !==
      (NetworkedAnimationAction.flags[eid] & ANIMATION_FLAGS.CLAMP_WHEN_FINISHED)
    ) {
      const clampWhenFinished =
        NetworkedAnimationAction.flags[eid] & ANIMATION_FLAGS.CLAMP_WHEN_FINISHED ? true : false;
      action.clampWhenFinished = clampWhenFinished;
    }
    if (
      (BitAnimationAction.flags[eid] & ANIMATION_FLAGS.LOOP) !==
      (NetworkedAnimationAction.flags[eid] & ANIMATION_FLAGS.LOOP)
    ) {
      const loop = NetworkedAnimationAction.flags[eid] & ANIMATION_FLAGS.LOOP ? LoopRepeat : LoopOnce;
      action.setLoop(loop, Infinity);
    }
    if (
      (BitAnimationAction.flags[eid] & ANIMATION_FLAGS.ADDITIVE_BLENDING) !==
      (NetworkedAnimationAction.flags[eid] & ANIMATION_FLAGS.ADDITIVE_BLENDING)
    ) {
      const blendMode =
        NetworkedAnimationAction.flags[eid] & ANIMATION_FLAGS.ADDITIVE_BLENDING
          ? AdditiveAnimationBlendMode
          : NormalAnimationBlendMode;
      action.blendMode = blendMode;
    }
    if (
      (BitAnimationAction.flags[eid] & ANIMATION_FLAGS.PAUSED) !==
      (NetworkedAnimationAction.flags[eid] & ANIMATION_FLAGS.PAUSED)
    ) {
      const paused = NetworkedAnimationAction.flags[eid] & ANIMATION_FLAGS.PAUSED ? true : false;
      action.paused = paused;
    }
    if (
      (BitAnimationAction.flags[eid] & ANIMATION_FLAGS.RUNNING) !==
      (NetworkedAnimationAction.flags[eid] & ANIMATION_FLAGS.RUNNING)
    ) {
      const running = NetworkedAnimationAction.flags[eid] & ANIMATION_FLAGS.RUNNING ? true : false;
      if (running) {
        action.play();
      } else {
        action.stop();
      }
    }
    BitAnimationAction.flags[eid] = NetworkedAnimationAction.flags[eid];
  }

  if (BitAnimationAction.timeScale[eid] !== NetworkedAnimationAction.timeScale[eid]) {
    BitAnimationAction.timeScale[eid] = NetworkedAnimationAction.timeScale[eid];
    action.timeScale = NetworkedAnimationAction.timeScale[eid];
  }

  if (BitAnimationAction.weight[eid] !== NetworkedAnimationAction.weight[eid]) {
    BitAnimationAction.weight[eid] = NetworkedAnimationAction.weight[eid];
    action.weight = NetworkedAnimationAction.weight[eid];
  }

  if (BitAnimationAction.time[eid] !== NetworkedAnimationAction.time[eid]) {
    BitAnimationAction.time[eid] = NetworkedAnimationAction.time[eid];
    action.time = NetworkedAnimationAction.time[eid];
  }
}

const createAnimationActionDef = makeFlowNodeDefinition({
  typeName: "animation/createAnimationAction",
  category: "Animation" as any,
  label: "Create AnimationAction",
  in: () => [
    { key: "flow", valueType: "flow" },
    { key: "clipName", valueType: "string" },
    { key: "loop", valueType: "boolean", defaultValue: true },
    { key: "clampWhenFinished", valueType: "boolean", defaultValue: false },
    { key: "weight", valueType: "float", defaultValue: 1 },
    { key: "timeScale", valueType: "float", defaultValue: 1 },
    { key: "additiveBlending", valueType: "boolean", defaultValue: false },
    { key: "entity", valueType: "entity" }
  ],
  initialState: undefined,
  out: { flow: "flow", action: "animationAction" },
  triggered: ({ read, write, commit, graph }) => {
    const clipName = read("clipName") as string;
    const loop = read("loop") as boolean;
    const clampWhenFinished = read("clampWhenFinished") as boolean;
    const weight = read("weight") as number;
    const timeScale = read("timeScale") as number;
    const additiveBlending = read("additiveBlending") as boolean;
    const targetEid = read("entity") as EntityID;

    const rootEid = graph.getDependency<EntityID>("rootEntity")!;
    const world = graph.getDependency<HubsWorld>("world")!;
    const obj = world.eid2obj.get(rootEid)!;
    const targetObj = world.eid2obj.get(targetEid)!;
    const mixer = MixerAnimatableData.get(rootEid)!;

    const blendMode = additiveBlending ? AdditiveAnimationBlendMode : NormalAnimationBlendMode;
    const action = mixer.clipAction(AnimationClip.findByName(obj.animations, clipName), targetObj, blendMode);
    action.setLoop(loop ? LoopRepeat : LoopOnce, Infinity);
    action.clampWhenFinished = clampWhenFinished;
    action.weight = weight;
    action.timeScale = timeScale;

    const actionEid = addEntity(world);

    APP.world.eid2action.set(actionEid, action);
    if (!ObjectAnimationActionData.has(targetEid)) {
      ObjectAnimationActionData.set(targetEid, new Set());
    }
    const actionEids = ObjectAnimationActionData.get(targetEid);
    const index = actionEids?.size;
    actionEids?.add(actionEid);

    action.eid = actionEid;
    addComponent(world, BitAnimationAction, actionEid);
    if (hasComponent(world, NetworkedAnimation, targetEid)) {
      addComponent(world, Networked, actionEid);
      const rootNid = APP.getString(Networked.id[targetEid])!;
      setInitialNetworkedData(actionEid, `${rootNid}.${index}`, rootNid);
      addComponent(world, NetworkedAnimationAction, actionEid);
      takeSoftOwnership(world, actionEid);
    }

    write("action", actionEid);
    commit("flow");
  }
});

type ActionEventListener = (e: { action: AnimationAction }) => void;
export class PlayAnimationNode extends AsyncNode {
  public static Description = new NodeDescription2({
    typeName: "animation/play",
    otherTypeNames: ["flow/delay"],
    category: "Animation",
    label: "Play Animation",
    factory: (description, graph) => new PlayAnimationNode(description, graph)
  });

  constructor(description: NodeDescription, graph: IGraphApi) {
    super(
      description,
      graph,
      [
        new Socket("flow", "flow"), //
        new Socket("animationAction", "action"),
        new Socket("boolean", "reset", true)
      ],
      [
        new Socket("flow", "flow"), //
        new Socket("flow", "finished"),
        new Socket("flow", "loop"),
        new Socket("flow", "stopped")
      ]
    );
  }

  private state: {
    action?: AnimationAction;
    onLoop?: ActionEventListener;
    onFinished?: ActionEventListener;
    onStop?: ActionEventListener;
  } = {};

  clearState() {
    if (this.state.action) {
      this.state.action.getMixer().removeEventListener("finished", this.state.onFinished as any);
      this.state.action.getMixer().removeEventListener("loop", this.state.onLoop as any);
      this.state.action.getMixer().removeEventListener("hubs_stopped", this.state.onLoop as any);
      this.state = {};
    }
  }

  triggered(engine: Engine, _triggeringSocketName: string, finished: () => void) {
    if (this.state.action) {
      console.warn("already playing", this.state.action);
      this.clearState();
    }

    const actionEid = this.readInput("action") as number;
    const reset = this.readInput("reset") as boolean;

    const action = APP.world.eid2action.get(actionEid)!;

    this.state.action = action;
    this.state.onFinished = (e: { action: AnimationAction }) => {
      if (e.action != this.state.action) return;
      console.log("FINISH", e.action.getClip().name, APP.world.time.tick);
      // TODO HACK when transitioning to another animation in this event, even on the same frame, the object seems to reset to its base position momentarily without this
      e.action.enabled = true;

      this.clearState();
      engine.commitToNewFiber(this, "finished");
    };
    this.state.onLoop = (e: { action: AnimationAction }) => {
      if (e.action != this.state.action) return;
      engine.commitToNewFiber(this, "loop");
    };
    this.state.onStop = (e: { action: AnimationAction }) => {
      if (e.action != this.state.action) return;
      this.clearState();
      engine.commitToNewFiber(this, "stopped");
    };

    action.getMixer().addEventListener("finished", this.state.onFinished as any);
    action.getMixer().addEventListener("loop", this.state.onLoop as any);
    action.getMixer().addEventListener("hubs_stopped", this.state.onStop as any);

    if (reset) action.reset();
    action.paused = false;
    action.play();
    console.log("PLAY", action.getClip().name, APP.world.time.tick);

    const world = this.graph.getDependency("world") as HubsWorld;

    if (hasComponent(world, NetworkedAnimationAction, actionEid)) {
      const targetObj = action.getRoot();
      if (hasComponent(world, Owned, targetObj.eid!)) {
        takeOwnership(world, actionEid);
      }
    }

    engine.commitToNewFiber(this, "flow");
    finished();
  }

  // NOTE this does not get called if the AsyncNode has finished()
  dispose() {
    this.clearState();
  }
}

export const AnimationNodes = definitionListToMap([
  createAnimationActionDef,
  PlayAnimationNode.Description,
  makeFlowNodeDefinition({
    typeName: "animation/stop",
    category: "Animation" as any,
    label: "Stop Animation",
    in: () => [
      { key: "flow", valueType: "flow" },
      { key: "action", valueType: "animationAction" }
    ],
    initialState: undefined,
    out: { flow: "flow" },
    triggered: ({ read, commit, graph }) => {
      const actionEid = read("action") as number;

      const action = APP.world.eid2action.get(actionEid)!;
      action.stop();

      const world = graph.getDependency("world") as HubsWorld;
      if (hasComponent(world, NetworkedAnimationAction, actionEid)) {
        const targetObj = action.getRoot();
        if (hasComponent(world, Owned, targetObj.eid!)) {
          takeOwnership(world, actionEid);
        }
      }

      console.log("STOP", action.getClip().name, APP.world.time.tick);
      action.getMixer().dispatchEvent({ type: "hubs_stopped", action });
      commit("flow");
    }
  }),
  makeFlowNodeDefinition({
    typeName: "animation/crossfadeTo",
    category: "Animation" as any,
    label: "Crossfade To Animation",
    in: () => [
      { key: "flow", valueType: "flow" },
      { key: "action", valueType: "animationAction" },
      { key: "toAction", valueType: "animationAction" },
      { key: "duration", valueType: "float" },
      { key: "warp", valueType: "boolean" }
    ],
    initialState: undefined,
    out: { flow: "flow" },
    triggered: ({ read, commit }) => {
      const actionEid = read("action") as number;
      const toActionId = read("toAction") as number;
      const duration = read("duration") as number;
      const warp = read("warp") as boolean;

      const action = APP.world.eid2action.get(actionEid)!;
      const toAction = APP.world.eid2action.get(toActionId)!;

      action.crossFadeTo(toAction, duration, warp);

      commit("flow");
    }
  }),
  makeFlowNodeDefinition({
    typeName: "three/animation/setTimescale",
    category: "Animation" as any,
    label: "Set timeScale",
    in: () => [
      { key: "flow", valueType: "flow" },
      { key: "action", valueType: "animationAction" },
      { key: "timeScale", valueType: "float" }
    ],
    initialState: undefined,
    out: { flow: "flow" },
    triggered: ({ read, commit, graph }) => {
      const actionEid = read("action") as number;
      const timeScale = read("timeScale") as number;

      const action = APP.world.eid2action.get(actionEid)!;
      action.timeScale = timeScale;

      const world = graph.getDependency("world") as HubsWorld;
      if (hasComponent(world, NetworkedAnimationAction, actionEid)) {
        const targetObj = action.getRoot();
        if (hasComponent(world, Owned, targetObj.eid!)) {
          takeOwnership(world, actionEid);
        }
      }

      commit("flow");
    }
  }),
  makeInNOutFunctionDesc({
    name: "animation/isRunning",
    label: "Is Animation Running?",
    category: "Animation" as any,
    in: [{ action: "animationAction" }],
    out: "boolean",
    exec: (action: number) => {
      const _action = APP.world.eid2action.get(action)!;
      return _action.isRunning();
    }
  })
]);

const behaviorGraphsQuery = defineQuery([BehaviorGraph]);
const behaviorGraphExitQuery = exitQuery(behaviorGraphsQuery);
const networkedAnimationQuery = defineQuery([NetworkedAnimation]);
const networkedAnimationExitQuery = exitQuery(networkedAnimationQuery);
const networkedAnimationActionQuery = defineQuery([Networked, NetworkedAnimationAction]);
const networkedAnimationActionExitQuery = exitQuery(networkedAnimationActionQuery);
export function animationSystem(world: HubsWorld) {
  behaviorGraphExitQuery(world).forEach(eid => {
    APP.world.eid2action.clear();
  });
  networkedAnimationExitQuery(world).forEach(eid => {
    const actionEids = ObjectAnimationActionData.get(eid);
    actionEids?.forEach(actionEid => removeEntity(world, actionEid));
  });
  networkedAnimationActionExitQuery(world).forEach(eid => {
    APP.world.eid2action.delete(eid);
  });
  networkedAnimationActionQuery(world).forEach(eid => {
    const action = APP.world.eid2action.get(eid)!;
    if (hasComponent(world, Owned, eid)) {
      action2Component(world, eid, action);
    } else {
      component2Action(world, eid, action);
    }
  });
}
