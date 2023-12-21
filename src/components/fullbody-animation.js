import { AnimationClip } from 'three';
import { paths } from "../systems/userinput/paths";

export const ANIMATIONS = {
    IDLE: "Idle",
    WALKING_FORWARD: "Walking",
    WALKING_BACKWARD: "WalkingBackwards",
    WALKING_LEFT: "LeftStrafeWalk",
    WALKING_RIGHT: "RightStrafeWalk",
    RUNNING_FORWARD: "Running",
    RUNNING_BACKWARD: "RunningBackward",
    RUNNING_LEFT: "LeftStrafe",
    RUNNING_RIGHT: "RightStrafe",
};

AFRAME.registerComponent("fullbody-animation-change", {
    userinput: null,

    init() {
        this.userinput = AFRAME.scenes[0].systems.userinput;
    },

    tick() {
        const vector = this.userinput.get(paths.actions.characterAcceleration);
        const boost = this.userinput.get(paths.actions.boost);

        if (vector) {
            const [right, front] = vector;
            const isRunning = boost || 1 < Math.abs(right) || 1 < Math.abs(front)

            if (front === 0 && right === 0) {
                this.setCurrentAnimation(ANIMATIONS.IDLE)
            } else if (Math.abs(front) < Math.abs(right)) {
                if (0 < right) {
                    this.setCurrentAnimation(isRunning ? ANIMATIONS.RUNNING_RIGHT : ANIMATIONS.WALKING_RIGHT);
                } else {
                    this.setCurrentAnimation(isRunning ? ANIMATIONS.RUNNING_LEFT : ANIMATIONS.WALKING_LEFT);
                }
            } else {
                if (0 < front) {
                    this.setCurrentAnimation(isRunning ? ANIMATIONS.RUNNING_FORWARD : ANIMATIONS.WALKING_FORWARD);
                } else {
                    this.setCurrentAnimation(isRunning ? ANIMATIONS.RUNNING_BACKWARD : ANIMATIONS.WALKING_BACKWARD);
                }
            }
        }
    },

    setCurrentAnimation(animationName) {
        const attrs = this.el.getAttribute('networked-avatar')

        if (attrs.avatar_pose !== animationName) {
            this.el.setAttribute("networked-avatar", { avatar_pose: animationName });
        }
    },
});

AFRAME.registerComponent("fullbody-animation-play", {
    animations: null,
    clock: null,
    mixer: null,

    init() {
        this.playAnimation = this.playAnimation.bind(this);

        this.animations = this.findAnimations();
        this.avatarRoot = this.findAvatarRoot();
        this.networkedAvatar = this.findNetworkAvatarEl(this.el);
        this.mixer = new THREE.AnimationMixer(this.avatarRoot);
    },

    remove() {
        if (this.mixer) {
            this.mixer.stopAllAction()

            if (this.avatarRoot) {
                this.mixer.uncacheRoot(this.avatarRoot)
            }
        }
    },

    findNetworkAvatarEl() {
        let currentObject = this.el

        while (!(currentObject.components && currentObject.components["networked-avatar"])) {
            currentObject = currentObject.parentEl

            if (!currentObject) {
                return null;
            }
        }

        return currentObject;
    },

    findAvatarRoot() {
        let currentObject = this.el.object3D

        while (currentObject.name !== 'AvatarRoot') {
            currentObject = currentObject.parent

            if (!currentObject) {
                return null;
            }
        }

        return currentObject;
    },

    findAnimations() {
        let currentObject = this.el.object3D

        while (currentObject.animations.length === 0) {
            currentObject = currentObject.parent

            if (!currentObject) {
                return [];
            }
        }

        return currentObject.animations;
    },

    playAnimation(animationName) {
        if (this.currentClip) {
            this.mixer.stopAllAction()
            this.mixer.uncacheClip(this.currentClip)
        }

        this.currentClip = AnimationClip.findByName(this.animations, animationName)

        if (this.currentClip) {
            this.mixer.stopAllAction()

            const action = this.mixer.clipAction(this.currentClip)
            action.clampWhenFinished = true
            /**
             * 2.3 is an arbitrary value that takes into account how fast
             * the avatar is moving and adjusts the speed of the animation accordingly.
             */
            action.timeScale = 2.3

            if (animationName === 'Idle') {
                action.paused = true
            }

            action.play()
        }
    },

    tick(t, dt) {
        this.mixer && this.mixer.update(dt / 1000)

        const attrs = this.networkedAvatar.getAttribute('networked-avatar')

        if (this.currentAnimationName !== attrs.avatar_pose) {
            this.playAnimation(attrs.avatar_pose)
            this.currentAnimationName = attrs.avatar_pose
        }
    },
});
