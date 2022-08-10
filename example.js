import * as THREE from /*'three'*/ "./three.module.js";
import { GLTFLoader } from /*'./jsm/loaders/GLTFLoader.js'*/ "blob:https://threejs.org/accd0402-14b8-419c-813c-f5dae91427a5";

let scene, renderer, camera;
let model, skeleton, mixer, clock;

const crossFadeControls = [];

let idleAction, walkAction, runAction;
let idleWeight, walkWeight, runWeight;
let actions, settings;

let singleStepMode = false;
let sizeOfNextStep = 0;

init();

function init() {
  const container = document.getElementById("container");

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.set(1, 2, -3);
  camera.lookAt(0, 1, 0);

  clock = new THREE.Clock();

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa0a0a0);
  scene.fog = new THREE.Fog(0xa0a0a0, 10, 50);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
  hemiLight.position.set(0, 20, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff);
  dirLight.position.set(-3, 10, -10);
  dirLight.castShadow = true;
  dirLight.shadow.camera.top = 2;
  dirLight.shadow.camera.bottom = -2;
  dirLight.shadow.camera.left = -2;
  dirLight.shadow.camera.right = 2;
  dirLight.shadow.camera.near = 0.1;
  dirLight.shadow.camera.far = 40;
  scene.add(dirLight);

  // scene.add( new THREE.CameraHelper( dirLight.shadow.camera ) );

  // ground

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const loader = new GLTFLoader();
  loader.load("models/gltf/Soldier.glb", function (gltf) {
    model = gltf.scene;
    scene.add(model);

    model.traverse(function (object) {
      if (object.isMesh) object.castShadow = true;
    });

    //

    skeleton = new THREE.SkeletonHelper(model);
    skeleton.visible = false;
    scene.add(skeleton);

    //

    //

    const animations = gltf.animations;

    mixer = new THREE.AnimationMixer(model);

    idleAction = mixer.clipAction(animations[0]);
    walkAction = mixer.clipAction(animations[3]);
    runAction = mixer.clipAction(animations[1]);

    actions = [idleAction, walkAction, runAction];

    activateAllActions();

    animate();
  });

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  stats = new Stats();
  container.appendChild(stats.dom);

  window.addEventListener("resize", onWindowResize);
}

function activateAllActions() {
  setWeight(idleAction);
  setWeight(walkAction);
  setWeight(runAction);

  actions.forEach(function (action) {
    action.play();
  });
}

function pauseAllActions() {
  actions.forEach(function (action) {
    action.paused = true;
  });
}

function unPauseAllActions() {
  actions.forEach(function (action) {
    action.paused = false;
  });
}

function prepareCrossFade(startAction, endAction, defaultDuration) {
  // Switch default / custom crossfade duration (according to the user's choice)

  const duration = setCrossFadeDuration(defaultDuration);

  // Make sure that we don't go on in singleStepMode, and that all actions are unpaused

  singleStepMode = false;
  unPauseAllActions();

  // If the current action is 'idle' (duration 4 sec), execute the crossfade immediately;
  // else wait until the current action has finished its current loop

  if (startAction === idleAction) {
    executeCrossFade(startAction, endAction, duration);
  } else {
    synchronizeCrossFade(startAction, endAction, duration);
  }
}

function synchronizeCrossFade(startAction, endAction, duration) {
  mixer.addEventListener("loop", onLoopFinished);

  function onLoopFinished(event) {
    if (event.action === startAction) {
      mixer.removeEventListener("loop", onLoopFinished);

      executeCrossFade(startAction, endAction, duration);
    }
  }
}

function executeCrossFade(startAction, endAction, duration) {
  // Not only the start action, but also the end action must get a weight of 1 before fading
  // (concerning the start action this is already guaranteed in this place)

  setWeight(endAction, 1);
  endAction.time = 0;

  // Crossfade with warping - you can also try without warping by setting the third parameter to false

  startAction.crossFadeTo(endAction, duration, true);
}

// This function is needed, since animationAction.crossFadeTo() disables its start action and sets
// the start action's timeScale to ((start animation's duration) / (end animation's duration))

function setWeight(action, weight) {
  action.enabled = true;
  action.setEffectiveTimeScale(1);
  action.setEffectiveWeight(weight);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  // Render loop

  requestAnimationFrame(animate);

  idleWeight = idleAction.getEffectiveWeight();
  walkWeight = walkAction.getEffectiveWeight();
  runWeight = runAction.getEffectiveWeight();

  // Get the time elapsed since the last frame, used for mixer update (if not in single step mode)

  let mixerUpdateDelta = clock.getDelta();

  // If in single step mode, make one step and then do nothing (until the user clicks again)

  // Update the animation mixer, the stats panel, and render this frame

  mixer.update(mixerUpdateDelta);

  renderer.render(scene, camera);
}

//# sourceURL=undefined
