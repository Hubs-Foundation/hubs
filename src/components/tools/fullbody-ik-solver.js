/**
 * Customized version of CCDIKSolver.js from three.js
 * Original source: [three.js/examples/jsm/animation/CCDIKSolver.js](https://threejs.org/examples/jsm/animation/CCDIKSolver.js)
 *
 * Modified by: hunjuly@gmail.com
 *
 * three.js is licensed under the MIT License.
 * See the original file for the full license text.
 */


import { Quaternion, Vector3 } from 'three';

const _q = new Quaternion();
const _targetPos = new Vector3();
const _targetVec = new Vector3();
const _effectorPos = new Vector3();
const _effectorVec = new Vector3();
const _linkPos = new Vector3();
const _invLinkQ = new Quaternion();
const _linkScale = new Vector3();
const _axis = new Vector3();
const _vector = new Vector3();

export class FullBodyIKSolver {
    /**
     * @param {Array<Object>} iks
     */
    constructor({ left, right }) {
        this.iks = [
            {
                target: left.handTarget,
                effector: left.hand,
                links: [
                    {
                        index: left.lowerArm,
                        rotationMin: new THREE.Vector3(0, -2, 0),
                        rotationMax: new THREE.Vector3(0, 0, 2.5),
                    },
                    {
                        index: left.upperArm,
                        rotationMin: new THREE.Vector3(-0.8, -0.7, -0.3),
                        rotationMax: new THREE.Vector3(1.0, 0.7, 2.2),
                    },
                ],
            }, {
                target: right.handTarget,
                effector: right.hand,
                links: [
                    {
                        index: right.lowerArm,
                        rotationMin: new THREE.Vector3(0, 0, -2.5),
                        rotationMax: new THREE.Vector3(0, 2, 0),
                    },
                    {
                        index: right.upperArm,
                        rotationMin: new THREE.Vector3(-0.8, -0.7, -2.2),
                        rotationMax: new THREE.Vector3(1.0, 0.7, 0.3),
                    },
                ],
            }
        ];

    }

    update() {
        const iks = this.iks;

        for (let i = 0, il = iks.length; i < il; i++) {
            this.updateOne(iks[i]);
        }

        return this;
    }

    updateOne(ik) {
        // for reference overhead reduction in loop
        const math = Math;
        const target = ik.target
        const effector = ik.effector

        // don't use getWorldPosition() here for the performance
        // because it calls updateMatrixWorld( true ) inside.
        _targetPos.setFromMatrixPosition(target.matrixWorld);

        const links = ik.links;

        let current = effector
        for (let j = 0, jl = links.length; j < jl; j++) {

            const link = links[j].index;

            // skip this link and following links.
            // this skip is used for MMD performance optimization.
            if (links[j].enabled === false) break;

            const rotationMin = links[j].rotationMin;
            const rotationMax = links[j].rotationMax;

            // don't use getWorldPosition/Quaternion() here for the performance
            // because they call updateMatrixWorld( true ) inside.
            link.matrixWorld.decompose(_linkPos, _invLinkQ, _linkScale);
            _invLinkQ.invert();
            _effectorPos.setFromMatrixPosition(effector.matrixWorld);

            // work in link world
            _effectorVec.subVectors(_effectorPos, _linkPos);
            _effectorVec.applyQuaternion(_invLinkQ);
            _effectorVec.normalize();

            _targetVec.subVectors(_targetPos, _linkPos);
            _targetVec.applyQuaternion(_invLinkQ);
            _targetVec.normalize();

            let angle = _targetVec.dot(_effectorVec);

            if (angle > 1.0) {
                angle = 1.0;
            } else if (angle < - 1.0) {
                angle = - 1.0;
            }

            angle = math.acos(angle);

            // skip if changing angle is too small to prevent vibration of bone
            if (angle < 1e-5) continue;

            if (ik.minAngle !== undefined && angle < ik.minAngle) {
                angle = ik.minAngle;
            }

            if (ik.maxAngle !== undefined && angle > ik.maxAngle) {
                angle = ik.maxAngle;
            }

            _axis.crossVectors(_effectorVec, _targetVec);
            _axis.normalize();

            _q.setFromAxisAngle(_axis, angle);
            link.quaternion.multiply(_q);

            if (rotationMin !== undefined) {
                link.rotation.setFromVector3(_vector.setFromEuler(link.rotation).max(rotationMin));
            }

            if (rotationMax !== undefined) {
                link.rotation.setFromVector3(_vector.setFromEuler(link.rotation).min(rotationMax));
            }

            link.updateMatrixWorld(true);

            current = current.parent;
        }
    }
}
