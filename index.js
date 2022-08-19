import * as cannon from "./cannon-es.js";
import { load3D } from "./3Dloader.js";
//////////////////////////////////////////////////////
let loading = true;
let player;
let actions;
let currentAction;
let skeleton, mixer, clock;
let idleAction, walkAction, runAction, tAction;
let play = false;
let gltf;
let Perspective = "tp";
class playerAnimator {
  constructor() {}

  Animate() {
    clock = new THREE.Clock();
    skeleton = new THREE.SkeletonHelper(player);
    skeleton.visible = false;
    scene.add(skeleton);
    const animations = gltf.animations;

    mixer = new THREE.AnimationMixer(player);

    idleAction = mixer.clipAction(animations[0]);
    walkAction = mixer.clipAction(animations[3]);
    runAction = mixer.clipAction(animations[1]);
    tAction = mixer.clipAction(animations[2]);

    actions = [idleAction, walkAction, runAction, tAction];
    this.activateAllActions();
    currentAction = idleAction;
  }
  activateAllActions() {
    this.setWeight(idleAction, 1);
    this.setWeight(walkAction, 0);
    this.setWeight(runAction, 0);
    this.setWeight(tAction, 0);

    actions.forEach(function (action) {
      action.play();
    });
  }

  pauseAllActions() {
    actions.forEach(function (action) {
      action.paused = true;
    });
  }

  unPauseAllActions() {
    actions.forEach(function (action) {
      action.paused = false;
    });
  }

  prepareCrossFade(startAction, endAction, defaultDuration) {
    const duration = defaultDuration;

    if (endAction != currentAction) {
      this.executeCrossFade(startAction, endAction, duration);
    }
  }

  executeCrossFade(startAction, endAction, duration) {
    this.setWeight(endAction, 1);
    endAction.time = 0;
    startAction.crossFadeTo(endAction, duration, true);
    currentAction = endAction;
  }

  setWeight(action, weight) {
    action.enabled = true;
    action.setEffectiveTimeScale(1);
    action.setEffectiveWeight(weight);
  }
  Playeranimate() {
    let mixerUpdateDelta = clock.getDelta();
    mixer.update(mixerUpdateDelta);
  }

  // # sourceURL=undefined
}

//////////////////////////////////////////////////////
let MoveDir = new THREE.Vector3();
const scene = new THREE.Scene();
scene.background = 0xffffff;
scene.fog = new THREE.Fog(0x82e2e5, 0.1, 20);
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0.8, 0.1, -0.3);
const renderer = new THREE.WebGLRenderer({
  antialias: true,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const Texture = new THREE.TextureLoader();

const b1 = Texture.load("assets/brick/b1.cm.jpg");
const b2 = Texture.load("assets/brick/b1.nm.jpg");
const b3 = Texture.load("assets/brick/b1.rm.jpg");
b1.wrapS = THREE.RepeatWrapping;
b1.wrapT = THREE.RepeatWrapping;
b2.wrapS = THREE.RepeatWrapping;
b2.wrapT = THREE.RepeatWrapping;
b3.wrapS = THREE.RepeatWrapping;
b3.wrapT = THREE.RepeatWrapping;
b1.repeat.set(50, 50);
b2.repeat.set(50, 50);
b3.repeat.set(50, 50);

const environmentLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.3);
scene.add(environmentLight);
const light = new THREE.AmbientLight(0x404040);
const dirLight = new THREE.DirectionalLight(0xffffff);
dirLight.position.set(3, 3, 3);
dirLight.castShadow = true;
dirLight.shadow.camera.top = 2;
dirLight.shadow.camera.bottom = -2;
dirLight.shadow.camera.left = -2;
dirLight.shadow.camera.right = 2;
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 40;
scene.add(dirLight, dirLight.target);
const pivot = new THREE.AxesHelper(20);
const grid = new THREE.GridHelper(10);
scene.add(pivot, grid, light);

const geometry1 = new THREE.PlaneBufferGeometry(100, 100);
const geometry2 = new THREE.BoxBufferGeometry(0.6, 1.6, 0.6);

const material1 = new THREE.MeshStandardMaterial({
  // color: 0x848484,
  map: b1,
  normalMap: b2,
  roughnessMap: b3,
});
const material2 = new THREE.MeshStandardMaterial({
  wireframe: true,
});

const terrain = new THREE.Mesh(geometry1, material1);
const PlayerHitbox = new THREE.Mesh(geometry2, material2);
scene.add(terrain, PlayerHitbox);
/////////////////////////////////////////////////////////////

const world = new cannon.World({
  gravity: new cannon.Vec3(0, -10, 0),
});

const cm1 = new cannon.Material();
const cm2 = new cannon.Material();
const c12 = new cannon.ContactMaterial(cm1, cm2, {
  friction: 0,
  restitution: 0,
});

const groundbody = new cannon.Body({
  shape: new cannon.Plane(),
  type: cannon.Body.STATIC,
  material: cm1,
});
const playerBody = new cannon.Body({
  shape: new cannon.Box(new cannon.Vec3(0.3, 0.8, 0.3)),
  position: new cannon.Vec3(0, 5, 0),
  mass: 5,
  material: cm2,
  linearDamping: 0.6,
  angularDamping: 1,
});
world.addBody(groundbody);
world.addBody(playerBody);
world.addContactMaterial(c12);
groundbody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
terrain.quaternion.copy(groundbody.quaternion);
const timestep = 1 / 60;

const rayCaster = new THREE.Raycaster();
const Pointer = new THREE.Vector2();

//////////////////////////////////////////////////////
const Loader = new load3D();
const PlayerLoad = new playerAnimator();
Loader.gltfLoad("assets/models/grass.glb", (a, b) => {
  a.position.set(0, 1, 0);
  scene.add(a);
  console.log("lol");
});
Loader.gltfLoad("assets/models/Soldier.glb", (x, y) => {
  player = x;
  gltf = y;
  scene.add(player);
  PlayerLoad.Animate();
  loading = false;
});
PlayerHitbox.visible = false;
//////////////////////////////////////////////////////
terrain.receiveShadow = true;

let move = [
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
];
let now = new THREE.Clock();
let playerDir = 0;
let speedFactor = 1;
function playerMovement() {
  if (move[0]) {
    PlayerActions(1);
    playerDir = 0;
    playerBody.velocity.set(
      MoveDir.x * 2 * speedFactor,
      playerBody.velocity.y,
      MoveDir.z * 2 * speedFactor
    );
  }
  if (move[1]) {
    PlayerActions(1);
    playerDir = 3;
    playerBody.velocity.set(
      -MoveDir.x * 2 * speedFactor,
      playerBody.velocity.y,
      -MoveDir.z * 2 * speedFactor
    );
  }
  if (move[2]) {
    PlayerActions(1);
    playerDir = 1.5;
    playerBody.velocity.set(
      MoveDir.z * 2 * speedFactor,
      playerBody.velocity.y,
      -MoveDir.x * 2 * speedFactor
    );
  }
  if (move[3]) {
    PlayerActions(1);
    playerDir = -1.5;
    playerBody.velocity.set(
      -MoveDir.z * 2 * speedFactor,
      playerBody.velocity.y,
      MoveDir.x * 2 * speedFactor
    );
  }
  if (move[4]) {
    if (160 <= Math.round(playerBody.velocity.y * Math.pow(10, 17)) <= 200) {
      PlayerLoad.setWeight(tAction, weigh);
      playerBody.applyImpulse(
        new cannon.Vec3(0, 50, 0),
        new cannon.Vec3(0, 2, 0)
      );
    }
  }
  if (move[5]) {
  }
  if (move[6]) {
    playerBody.velocity.set(0, playerBody.velocity.y, 0);
  }
  if (move[7]) {
  }
  if (move[8]) {
  }
  if (move[9]) {
    console.log(playerBody.velocity.y);
  }
  if (move[10]) {
  }
}
let running = false;
let weigh = 0;
function PlayerActions(x) {
  switch (x) {
    case 0:
      PlayerLoad.prepareCrossFade(currentAction, idleAction, 0.5);
      break;
    case 1:
      if (running) {
        PlayerLoad.prepareCrossFade(currentAction, runAction, 0.5);
      } else {
        PlayerLoad.prepareCrossFade(currentAction, walkAction, 0.5);
      }
      break;
    case 2:
      PlayerLoad.prepareCrossFade(currentAction, runAction, 2);
      break;
    case 3:
      PlayerLoad.prepareCrossFade(currentAction, runAction, 0.5);
      break;
    case 4:
      break;
    case 5:
      break;
    case 6:
      break;
  }
}
window.addEventListener("keydown", function (event) {
  switch (event.key.toLowerCase()) {
    case "w":
      move[0] = true;
      break;
    case "s":
      move[1] = true;
      break;
    case "a":
      move[2] = true;
      break;
    case "d":
      move[3] = true;
      break;
    case " ":
      weigh = 1;
      PlayerLoad.pauseAllActions();
      move[4] = true;
      break;
    case "shift":
      speedFactor = 4;
      running = true;
      move[5] = true;
      break;
    case "control":
      move[6] = true;
      break;
    case "ArrowUp":
      PlayerActions(3);
      move[7] = true;
      break;
    case "ArrowDown":
      move[8] = true;
      break;
    case "q":
      move[9] = true;
      break;
    case "e":
      move[10] = true;
      break;
    case "p":
      togglePerspective();
      break;
    case "h":
      hitboxToggle();
      break;
  }
});
window.addEventListener("keyup", function (event) {
  switch (event.key.toLowerCase()) {
    case "w":
      move[0] = false;
      break;
    case "s":
      move[1] = false;
      break;
    case "a":
      move[2] = false;
      break;
    case "d":
      move[3] = false;
      break;
    case " ":
      weigh = 0;
      PlayerLoad.setWeight(tAction, weigh);
      PlayerLoad.unPauseAllActions();
      move[4] = false;
      break;
    case "shift":
      running = false;
      speedFactor = 1;
      move[5] = false;
      break;
    case "control":
      move[6] = false;
      break;
    case "ArrowUp":
      move[7] = false;
      break;
    case "ArrowDown":
      move[8] = false;
      break;
    case "q":
      move[9] = false;
      break;
    case "e":
      move[10] = false;
      break;
  }
  if (!move.slice(0, 5).includes(true)) {
    PlayerActions(0);
  }
  playerBody.velocity.setZero();
});
document.addEventListener("click", function () {
  document.documentElement.requestFullscreen();
  if (play == true) {
    document.body.requestPointerLock();
  }
});
document.body.addEventListener("mousemove", (event) => {
  if (document.pointerLockElement === document.body) {
    Pointer.x -= event.movementX / 600;
    Pointer.y += event.movementY / 800;
    if (Perspective === "fp") {
      if (Pointer.y > 1.5) {
        Pointer.y = 1.55;
      } else if (Pointer.y < -1.7) {
        Pointer.y = -1.7;
      }
    } else if (Perspective === "tp") {
      if (Pointer.y > 2) {
        Pointer.y = 2;
      } else if (Pointer.y < 1) {
        Pointer.y = 1;
      }
    }
  }
});
window.onresize = () => {
  orWarn();
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(devicePixelRatio);
};
//////////////////////////////////////////////////////
const leftTouchArea = document.getElementById("leftcontrols");
const rightTouchArea = document.getElementById("rightcontrols");
const rightpanhammer = new Hammer.Manager(rightTouchArea);
const leftpanhammer = new Hammer.Manager(leftTouchArea);
rightpanhammer.add(
  new Hammer.Pan({
    direction: Hammer.DIRECTION_ALL,
    threshold: 0,
    pointers: 0,
  })
);
rightpanhammer.add(
  new Hammer.Tap({
    event: "doubletap",
    taps: 2,
  })
);
leftpanhammer.add(
  new Hammer.Pan({
    direction: Hammer.DIRECTION_ALL,
    threshold: 0,
    pointers: 0,
  }).recognizeWith([rightpanhammer.get("pan"), rightpanhammer.get("doubletap")])
);
rightpanhammer.on("pan", function (event) {
  Pointer.x -= event.velocityX / 4;
  Pointer.y += event.velocityY / 8;
  if (Perspective === "fp") {
    if (Pointer.y > 1.5) {
      Pointer.y = 1.55;
    } else if (Pointer.y < -1.7) {
      Pointer.y = -1.7;
    }
  } else if (Perspective === "tp") {
    if (Pointer.y > 2) {
      Pointer.y = 2;
    } else if (Pointer.y < 1) {
      Pointer.y = 1;
    }
  }
});
let touched = false;
rightpanhammer.on("doubletap", function () {
  jump();
});
leftpanhammer.on("panstart ", function () {
  touched = true;
  PlayerActions(1);
});
leftpanhammer.on("panend", function () {
  PlayerActions(0);
  touched = false;
  playerBody.velocity.setZero();
});
let PlayerVector = new THREE.Vector3();
leftpanhammer.on("panmove", function (event) {
  touchMove(speedFactor);
  playerDir = (event.angle + 90) / -60;
});
//////////////////////////////////////////////////////
const p = document.getElementById("p");
const h = document.getElementById("h");
const sprint = document.getElementById("sprint");
p.addEventListener("click", function () {
  togglePerspective();
});
h.addEventListener("click", function () {
  hitboxToggle();
});
sprint.addEventListener("click", function () {
  running === false
    ? ((running = true), (speedFactor = 4))
    : ((running = false), (speedFactor = 1));
  let x = sprint.style.background;

  x === "" ? (sprint.style.background = "red") : (sprint.style.background = "");
});
const togglePerspective = () => {
  Perspective == "tp" ? (Perspective = "fp") : (Perspective = "tp");
};
const hitboxToggle = () => {
  PlayerHitbox.visible == false
    ? (PlayerHitbox.visible = true)
    : (PlayerHitbox.visible = false);
};
function touchMove(speedFactor) {
  if (touched) {
    if (Perspective === "tp") {
      player.getWorldDirection(PlayerVector);
      playerBody.velocity.set(
        -PlayerVector.x * 2 * speedFactor,
        playerBody.velocity.y,
        -PlayerVector.z * 2 * speedFactor
      );
    } else if (Perspective === "fp") {
      playerBody.velocity.set(
        MoveDir.x * 2 * speedFactor,
        playerBody.velocity.y,
        MoveDir.z * 2 * speedFactor
      );
    }
  }
}
function jump() {
  if (160 <= Math.round(playerBody.velocity.y * Math.pow(10, 17)) <= 200) {
    weigh = 1;
    PlayerLoad.pauseAllActions();
    PlayerLoad.setWeight(tAction, weigh);
    playerBody.applyImpulse(
      new cannon.Vec3(0, 50, 0),
      new cannon.Vec3(0, 2, 0)
    );
    const jumpo = setInterval(function () {
      if (160 <= Math.round(playerBody.velocity.y * Math.pow(10, 17)) <= 200) {
        PlayerLoad.unPauseAllActions();
        weigh = 0;
        PlayerLoad.setWeight(tAction, weigh);
        clearInterval(jumpo);
      }
    }, 100);
  }
}
const tpcam = () => {
  camera.position.set(
    player.position.x + Math.sin(Pointer.x) * 2,
    player.position.y + Math.cos(Pointer.y) * 3 + 1.5,
    player.position.z + Math.cos(Pointer.x) * 2
  );
  camera.lookAt(player.position.x, player.position.y + 1, player.position.z);
};
const fpcam = () => {
  camera.position.set(
    player.position.x,
    1.5 + player.position.y,
    player.position.z
  );
  camera.lookAt(
    new THREE.Vector3(
      Math.sin(Pointer.x) * 4,
      -Pointer.y * 4,
      Math.cos(Pointer.x) * 4
    )
  );
};
function animate() {
  world.step(timestep);
  rayCaster.setFromCamera(Pointer, camera);
  camera.getWorldDirection(MoveDir);

  if (Perspective === "tp") {
    tpcam();
    player.visible = true;
    player.rotation.y = Pointer.x + playerDir;
  } else if (Perspective === "fp") {
    fpcam();
    player.visible = false;
  }
  playerMovement();
  touchMove(0);
  PlayerLoad.Playeranimate();

  playerBody.quaternion.x = 0;
  playerBody.quaternion.z = 0;

  player.position.copy(
    new cannon.Vec3(
      playerBody.position.x,
      playerBody.position.y - 0.8,
      playerBody.position.z
    )
  );

  dirLight.position.copy(
    new THREE.Vector3(
      player.position.x + 3,
      player.position.y + 3,
      player.position.z + 3
    )
  );
  PlayerHitbox.position.copy(playerBody.position);
  PlayerHitbox.quaternion.copy(playerBody.quaternion);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
//////////////////////////////////////////////////////
const GUI = document.getElementsByClassName("wrapper")[0];
const orien = document.getElementById("orienWarn");
const instructions = document.getElementById("instructions");
const instCancle = document.getElementById("instCancel");
function orWarn() {
  if (window.innerHeight > window.innerWidth) {
    orien.style.display = "flex";
  } else {
    orien.style.display = "none";
  }
}
instCancle.addEventListener("click", function () {
  instructions.style.display = "none";
});
function instructor() {
  instructions.style.display = "flex";
}

document
  .getElementsByClassName("play")[0]
  .addEventListener("click", function () {
    if (loading === false) {
      instructor();
      play = true;
      GUI.style.display = "none";
      animate();
      dirLight.target = player;
    } else {
      alert("The game is still Loading...");
    }
  });
orWarn();
window.onload = () => {
  document.getElementById("version").innerText = "1.18";
};
