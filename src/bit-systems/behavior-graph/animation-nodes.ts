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
  NetworkedAnimationActionsData,
  BehaviorGraph,
  MixerAnimatableData,
  Networked,
  NetworkedAnimation,
  Owned
} from "../../bit-components";
import { EntityID } from "../../utils/networking-types";
import { definitionListToMap } from "./utils";
import { defineQuery, enterQuery, exitQuery, hasComponent } from "bitecs";

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

export type AnimationActionDataT = {
  time: number;
  timeScale: number;
  weight: number;
  flags: number;
};
export type AnimationActionDataMapT = Map<string, AnimationActionDataT>;
export class AnimationActionsDataMap extends Map<string, AnimationActionDataT> {}
export class AnimationActionsMap extends Map<EntityID, AnimationActionsDataMap> {}

const id2action = new Map<string, AnimationAction>();
const id2time = new Map<string, number>();

function actionData2Action(actionData: AnimationActionDataT, action: AnimationAction) {
  const clampWhenFinished = actionData.flags & ANIMATION_FLAGS.CLAMP_WHEN_FINISHED ? true : false;
  const loop = actionData.flags & ANIMATION_FLAGS.LOOP ? LoopRepeat : LoopOnce;
  const blendMode =
    actionData.flags & ANIMATION_FLAGS.ADDITIVE_BLENDING ? AdditiveAnimationBlendMode : NormalAnimationBlendMode;
  const running = actionData.flags & ANIMATION_FLAGS.RUNNING ? true : false;
  const paused = actionData.flags & ANIMATION_FLAGS.PAUSED ? true : false;

  action.paused = paused;
  action.blendMode = blendMode;
  if (action.loop != loop) {
    action.setLoop(loop, Infinity);
  }
  action.clampWhenFinished = clampWhenFinished;
  action.timeScale = actionData.timeScale;
  action.weight = actionData.weight;
  action.time = actionData.time;
  if (running) {
    action.play();
  } else {
    action.stop();
  }
}

function action2ActionData(action: AnimationAction): AnimationActionDataT {
  let flags = 0;
  if (action.clampWhenFinished) flags |= ANIMATION_FLAGS.CLAMP_WHEN_FINISHED;
  if (action.blendMode === AdditiveAnimationBlendMode) flags |= ANIMATION_FLAGS.ADDITIVE_BLENDING;
  if (action.loop === LoopRepeat) flags |= ANIMATION_FLAGS.LOOP;
  if (action.isRunning()) flags |= ANIMATION_FLAGS.RUNNING;
  if (action.paused) flags |= ANIMATION_FLAGS.PAUSED;

  return { time: action.time, timeScale: action.timeScale, weight: action.weight, flags };
}

function syncAnimationAction(world: HubsWorld, action: AnimationAction) {
  if (
    action.eid !== undefined &&
    hasComponent(world, NetworkedAnimation, action.eid) &&
    hasComponent(world, Owned, action.eid)
  ) {
    const actionDatas = NetworkedAnimationActionsData.get(action.eid);
    if (actionDatas) {
      actionDatas.set(action.id!, action2ActionData(action));
    }
    const timestamp = performance.now();
    NetworkedAnimation.timestamp[action.eid] = timestamp;
    id2time.set(action.id!, timestamp);
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

    if (hasComponent(world, NetworkedAnimation, targetEid)) {
      action.id = `${targetEid}_${clipName}`;
      action.eid = targetEid;
      if (!NetworkedAnimationActionsData.has(targetEid)) {
        NetworkedAnimationActionsData.set(targetEid, new AnimationActionsDataMap());
      }
      const actionsData = NetworkedAnimationActionsData.get(targetEid)!;
      if (Networked.owner[targetEid] !== APP.str2sid.get("reticulum")) {
        const actionData = actionsData.get(action.id);
        if (actionData) {
          actionData2Action(actionData, action);
        }
      } else {
        actionsData.set(action.id, action2ActionData(action));
      }
      id2action.set(action.id, action);
    }

    write("action", action.id);
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

    const actionId = this.readInput("action") as string;
    const reset = this.readInput("reset") as boolean;

    const action = id2action.get(actionId)!;
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
    syncAnimationAction(world, action);

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
      const actionId = read("action") as string;

      const action = id2action.get(actionId)!;
      action.stop();

      const world = graph.getDependency("world") as HubsWorld;
      syncAnimationAction(world, action);

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
      const actionId = read("action") as string;
      const toActionId = read("toAction") as string;
      const duration = read("duration") as number;
      const warp = read("warp") as boolean;

      const action = id2action.get(actionId)!;
      const toAction = id2action.get(toActionId)!;
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
      const actionId = read("action") as string;
      const timeScale = read("timeScale") as number;

      const action = id2action.get(actionId)!;
      action.timeScale = timeScale;

      const world = graph.getDependency("world") as HubsWorld;
      syncAnimationAction(world, action);

      commit("flow");
    }
  }),
  makeInNOutFunctionDesc({
    name: "animation/isRunning",
    label: "Is Animation Running?",
    category: "Animation" as any,
    in: [{ action: "animationAction" }],
    out: "boolean",
    exec: (action: string) => {
      const _action = id2action.get(action)!;
      return _action.isRunning();
    }
  })
]);

const behaviorGraphsQuery = defineQuery([BehaviorGraph]);
const behaviorGraphExitQuery = exitQuery(behaviorGraphsQuery);
const animationQuery = defineQuery([Networked, NetworkedAnimation]);
const animationEnterQuery = enterQuery(animationQuery);
const animationExitQuery = exitQuery(animationQuery);
export function animationSystem(world: HubsWorld) {
  behaviorGraphExitQuery(world).forEach(eid => {
    id2action.clear();
    id2time.clear();
    NetworkedAnimationActionsData.clear();
  });
  animationEnterQuery(world).forEach(eid => {});
  animationExitQuery(world).forEach(eid => {
    NetworkedAnimationActionsData.delete(eid);
  });
  animationQuery(world).forEach(eid => {
    if (NetworkedAnimationActionsData.has(eid) && !hasComponent(world, Owned, eid)) {
      const actionDatas = NetworkedAnimationActionsData.get(eid)!;
      actionDatas.forEach((actionData: AnimationActionDataT, actionId: string) => {
        const action = id2action.get(actionId);
        // TODO: We should check per animation action timestamps to know if we should update an animation
        if (action && id2time.get(action.id!) !== NetworkedAnimation.timestamp[action.eid!]) {
          actionData2Action(actionData, action);
          id2time.set(action.id!, NetworkedAnimation.timestamp[action.eid!]);
        }
      });
    }
  });
}
