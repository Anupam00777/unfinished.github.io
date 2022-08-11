import * as cannon from "./cannon-es.js";
import { OBJLoader } from "./OBJLoader.js";
import { MTLLoader } from "./MTLLoader.js";
import { threeToCannon, ShapeType } from "./three-to-cannon.modern.js";
import { GLTFLoader } from "./GLTFLoader.js";

//////////////////////////////////////////////////////
let loading = true;
let player;
let actions;
let skeleton, mixer, clock;
let idleAction, walkAction, runAction;
let play = false;
let Perspective = "fp";
let ob3d = [];
let bd3d = [];
let mob3d = [];
let mbd3d = [];
class objectLoader {
  constructor(obj, k, m) {
    this.obj = obj;
    this.n = k;
    this.ms = m;
  }
  loadobj(obj, n) {
    let maxx = 2;
    let minx = -2;
    let maxy = 2;
    let miny = 0;
    let maxz = 2;
    let minz = -2;
    let x = 0;
    let y = 0;
    let z = 0;
    let d = 0;
    let pos;

    for (let l = 0; l < n; l++) {
      new MTLLoader()
        .setPath("assets/hills/modular_platformer_models/")
        .load(obj + ".mtl", function (materials) {
          materials.preload();

          new OBJLoader()
            .setMaterials(materials)
            .setPath("assets/hills/modular_platformer_models/")
            .load(obj + ".obj", function (object) {
              scene.add(object);
              ob3d.push(object);
              if (d == n - 1) {
                summonBody(n);
              }
              d++;
            });
        });
    }

    const summonBody = (chunk) => {
      for (let j = 0; j < chunk; j++) {
        tp[j] = j;
        tp[j] = [];

        while (!tp[j].includes(x + "-" + y + "-" + z)) {
          x = Math.floor(Math.random() * (maxx - minx) + minx);
          y = Math.floor(Math.random() * (maxy - miny) + miny);
          z = Math.floor(Math.random() * (maxz - minz) + minz);
          minx = x - minx;
          miny = y + 2;
          minz = z - minz;
          maxx = minx + 4;
          maxy = miny + 2;
          maxz = minz + 4;
          tp[j].push(x + "-" + y + "-" + z);
        }
        pos = new cannon.Vec3(x, y, z);
        boundLoad(ob3d[j], pos);
        ob3d[j].position.copy(pos);
      }
    };
    const boundLoad = (object, p) => {
      const object3d = threeToCannon(object, { type: ShapeType.HULL });
      const { shape, offset, quaternion } = object3d;
      const body = new cannon.Body({
        shape: shape,
        mass: 0,
        offset: offset,
        position: p,
        orientation: quaternion,
      });
      bd3d.push(body);
      world.addBody(body);
    };
  }
  massLoad(obj, n, ms) {
    let x = 2;
    let y = 2;
    let pos;
    for (let j = 0; j <= n; j++) {
      new MTLLoader()
        .setPath("assets/hills/modular_platformer_models/")
        .load(obj + ".mtl", function (materials) {
          materials.preload();

          new OBJLoader()
            .setMaterials(materials)
            .setPath("assets/hills/modular_platformer_models/")
            .load(obj + ".obj", function (object) {
              for (let i = 0; tp.includes(x + "-" + y); i++) {
                x = Math.ceil(Math.random() * 100 - 50);
                y = Math.ceil(Math.random() * 100 - 50);
              }
              tp.push(x + "-" + y);
              pos = new cannon.Vec3(x, 0, y);
              object.position.copy(pos);
              mob3d.push(object);
              massboundLoad(object);
              scene.add(object);
            });
        });
    }

    const massboundLoad = (object) => {
      const object3d = threeToCannon(object, { type: ShapeType.HULL });
      const { shape, offset, quaternion } = object3d;
      const body = new cannon.Body({
        shape: shape,
        mass: ms,
        offset: offset,
        position: pos,
        orientation: quaternion,
      });
      mbd3d.push(body);
      world.addBody(body);
    };
  }
  update() {
    for (let i = 0; i < ob3d.length; i++) {
      mob3d[i].position.copy(mbd3d[i].position);
      mob3d[i].quaternion.copy(mbd3d[i].quaternion);
    }
  }
}
class playerLoader {
  constructor() {
    this.playerLoad();
  }

  playerLoad() {
    clock = new THREE.Clock();

    const gloader = new GLTFLoader();
    gloader.load("assets/models/Soldier.glb", function (gltf) {
      player = gltf.scene;
      scene.add(player);

      player.traverse(function (object) {
        if (object.isMesh) object.castShadow = true;
      });
      skeleton = new THREE.SkeletonHelper(player);
      skeleton.visible = false;
      scene.add(skeleton);

      const animations = gltf.animations;

      mixer = new THREE.AnimationMixer(player);

      idleAction = mixer.clipAction(animations[0]);
      walkAction = mixer.clipAction(animations[3]);
      runAction = mixer.clipAction(animations[1]);

      actions = [idleAction, walkAction, runAction];
      activateAllActions();
      loading = false;
    });
    const activateAllActions = () => {
      this.setWeight(idleAction, 1);
      this.setWeight(walkAction, 0);
      this.setWeight(runAction, 0);

      actions.forEach(function (action) {
        action.play();
      });
    };
  }

  // pauseAllActions() {
  //   actions.forEach(function (action) {
  //     action.paused = true;
  //   });
  // }

  unPauseAllActions() {
    actions.forEach(function (action) {
      action.paused = false;
    });
  }

  prepareCrossFade(startAction, endAction, defaultDuration) {
    // Switch default / custom crossfade duration (according to the user's choice)
    const duration = defaultDuration;

    // Make sure that we don't go on in singleStepMode, and that all actions are unpaused

    this.unPauseAllActions();

    // If the current action is 'idle' (duration 4 sec), execute the crossfade immediately;
    // else wait until the current action has finished its current loop

    // if (startAction === idleAction) {
    this.executeCrossFade(startAction, endAction, duration);
    // } else {
    //   this.synchronizeCrossFade(startAction, endAction, duration);
    // }
  }

  // synchronizeCrossFade(startAction, endAction, duration) {
  //   mixer.addEventListener("loop", onLoopFinished);

  //   const onLoopFinished=(event)=> {
  //     if (event.action === startAction) {
  //       mixer.removeEventListener("loop", onLoopFinished);

  //       this.executeCrossFade(startAction, endAction, duration);
  //     }
  //   }
  // }

  executeCrossFade(startAction, endAction, duration) {
    // Not only the start action, but also the end action must get a weight of 1 before fading
    // (concerning the start action this is already guaranteed in this place)

    this.setWeight(endAction, 1);
    endAction.time = 0;

    // Crossfade with warping - you can also try without warping by setting the third parameter to false

    startAction.crossFadeTo(endAction, duration, true);
  }

  // This function is needed, since animationAction.crossFadeTo() disables its start action and sets
  // the start action's timeScale to ((start animation's duration) / (end animation's duration))

  setWeight(action, weight) {
    action.enabled = true;
    action.setEffectiveTimeScale(1);
    action.setEffectiveWeight(weight);
  }
  Playeranimate() {
    // idleWeight = idleAction.getEffectiveWeight();
    // walkWeight = walkAction.getEffectiveWeight();
    // runWeight = runAction.getEffectiveWeight();
    let mixerUpdateDelta = clock.getDelta();
    mixer.update(mixerUpdateDelta);
  }

  //# sourceURL=undefined
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
b2.wrapS = THREE.RepeatWrapping;
b2.wrapT = THREE.RepeatWrapping;
b3.wrapS = THREE.RepeatWrapping;
b3.wrapT = THREE.RepeatWrapping;
b2.repeat.set(50, 50);
b3.repeat.set(50, 50);

const environmentLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.3);
scene.add(environmentLight);

const dirLight = new THREE.DirectionalLight(0xffffff);
dirLight.position.set(100, 100, -80);
dirLight.castShadow = true;
dirLight.shadow.camera.top = 2;
dirLight.shadow.camera.bottom = -2;
dirLight.shadow.camera.left = -2;
dirLight.shadow.camera.right = 2;
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 40;
scene.add(dirLight);

const pivot = new THREE.AxesHelper(20);
const grid = new THREE.GridHelper(10);
scene.add(pivot, grid);

const geometry1 = new THREE.PlaneBufferGeometry(100, 100);

const material1 = new THREE.MeshStandardMaterial({
  color: 0x848484,
  normalMap: b2,
  roughnessMap: b3,
});

const terrain = new THREE.Mesh(geometry1, material1);
scene.add(terrain);
const PlayerLoad = new playerLoader();
//////////////////////////////////////////////////////

const world = new cannon.World({
  gravity: new cannon.Vec3(0, -10, 0),
});

const cm1 = new cannon.Material();
const cm2 = new cannon.Material();
const c12 = new cannon.ContactMaterial(cm1, cm2, {
  friction: 0.9,
  restitution: 0,
});

const groundbody = new cannon.Body({
  shape: new cannon.Plane(),
  type: cannon.Body.STATIC,
  material: cm1,
});
const playerBody = new cannon.Body({
  shape: new cannon.Sphere(0.8),
  position: new cannon.Vec3(0, 5, 0),
  mass: 5,
  material: cm2,
  linearDamping: 0.6,
  angularDamping: 1,
});
// const box = new cannon.Body({
//   shape: new cannon.Box(new cannon.Vec3(100, 0.25, 100)),
//   mass: 0,
//   position: new cannon.Vec3(3, 15, 0),

//   linearDamping: 0.2,
// });
let tp = {};
const nloader = new objectLoader();
nloader.loadobj("Prop_Crate", 200, 1);
world.addBody(groundbody);
world.addBody(playerBody);
world.addContactMaterial(c12);
groundbody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
terrain.quaternion.copy(groundbody.quaternion);
const timestep = 1 / 60;

const rayCaster = new THREE.Raycaster();
const Pointer = new THREE.Vector2();

//////////////////////////////////////////////////////

// player.castShadow = true;
// terrain.receiveShadow = true;

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
let deltaTime;
let moving = false;
function playerMovement() {
  if (move[0]) {
    playerBody.angularVelocity.set(
      MoveDir.z * 20 * (1 + deltaTime * 0.1),
      playerBody.velocity.y,
      -MoveDir.x * 20 * (1 + deltaTime * 0.1)
    );
    playerBody.applyForce(
      new cannon.Vec3(
        MoveDir.x * 12 * (1 + deltaTime * 0.1),
        0,
        MoveDir.z * 12 * (1 + deltaTime * 0.1)
      ),
      new cannon.Vec3(1, 0, 1)
    );
  }
  if (move[1]) {
    playerBody.angularVelocity.set(
      -MoveDir.z * 8,
      playerBody.velocity.y,
      MoveDir.x * 8
    );
    playerBody.applyForce(
      new cannon.Vec3(-MoveDir.x * 12, 0, -MoveDir.z * 12),
      new cannon.Vec3(1, 0, 1)
    );
  }
  if (move[2]) {
    playerBody.angularVelocity.set(
      -MoveDir.x * 8,
      playerBody.velocity.y,
      -MoveDir.z * 8
    );
    playerBody.applyForce(
      new cannon.Vec3(MoveDir.z * 12, 0, -MoveDir.x * 12),
      new cannon.Vec3(1, 0, 1)
    );
  }
  if (move[3]) {
    playerBody.angularVelocity.set(
      MoveDir.x * 8,
      playerBody.velocity.y,
      MoveDir.z * 8
    );
    playerBody.applyForce(
      new cannon.Vec3(-MoveDir.z * 12, 0, MoveDir.x * 12),
      new cannon.Vec3(1, 0, 1)
    );
  }
  if (move[4]) {
    playerBody.applyImpulse(new cannon.Vec3(0, 5, 0), new cannon.Vec3(0, 2, 0));
  }
  if (move[5]) {
    playerBody.velocity.set(0, playerBody.velocity.y, 0);
  }
  if (move[6]) {
  }
  if (move[7]) {
  }
  if (move[8]) {
  }
  if (move[9]) {
    playerBody.angularVelocity.set(
      playerBody.velocity.x,
      30,
      playerBody.velocity.z
    );
  }
  if (move[10]) {
    playerBody.angularVelocity.set(
      playerBody.velocity.x,
      30,
      playerBody.velocity.z
    );
  }
}
window.addEventListener("keydown", function (event) {
  if (!now.running) {
    now.start();
  }
  deltaTime = now.getElapsedTime();
  // console.log(event.key);
  if (!moving) {
    PlayerLoad.prepareCrossFade(idleAction, runAction, 1);
    moving = true;
  }
  switch (event.key) {
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
      move[4] = true;
      break;
    case "Control":
      move[5] = true;
      break;
    case "ArrowLeft":
      move[6] = true;
      break;
    case "ArrowUp":
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
      Perspective == "tp" ? (Perspective = "fp") : (Perspective = "tp");
      break;
  }
});
window.addEventListener("keyup", function (event) {
  now.stop();
  if (moving) {
    PlayerLoad.prepareCrossFade(runAction, idleAction, 0.5);
    moving = false;
  }
  switch (event.key) {
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
      move[4] = false;
      break;
    case "Control":
      move[5] = false;
      break;
    case "ArrowLeft":
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
  playerBody.angularVelocity.setZero();
});

document.addEventListener("click", function () {
  // document.documentElement.requestFullscreen();
  if (play == true) {
    document.body.requestPointerLock();
  }
});
let xs = 0;
let ys = 0;
let zs = 0;
document.body.addEventListener("mousemove", (event) => {
  if (document.pointerLockElement === document.body) {
    Pointer.x -= event.movementX / 600;
    Pointer.y += event.movementY / 800;
    // console.log(camera.rotation);
    // console.log(Pointer.x, Pointer.y);
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
  Pointer.x -= event.velocityX / 10;
  Pointer.y += event.velocityY / 10;
  if (Pointer.y > 2) {
    Pointer.y = 2;
  } else if (Pointer.y < 1) {
    Pointer.y = 1;
  }
});
rightpanhammer.on("doubletap", function () {
  playerBody.applyImpulse(new cannon.Vec3(0, 70, 0), new cannon.Vec3(0, 2, 0));
});
const nullify = () => {
  move[0] = false;
  move[1] = false;
  move[2] = false;
  move[3] = false;
};
leftpanhammer.on("panstart panend", function () {
  nullify();
  if (!moving) {
    PlayerLoad.prepareCrossFade(idleAction, walkAction, 1);
    moving = true;
  } else if (moving) {
    PlayerLoad.prepareCrossFade(walkAction, idleAction, 1);
    moving = true;
  }
});
leftpanhammer.on("panmove", function (event) {
  switch (Math.round(event.angle * 0.01 + 0.1)) {
    case -1:
      deltaTime = event.deltaTime * 0.01;
      move[0] = true;
      break;
    case 1:
      move[1] = true;
      break;
    case 2:
      move[2] = true;
      break;
    case 0:
      move[3] = true;
      break;
  }
});
//////////////////////////////////////////////////////
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
    player.position.z - 0.25
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
    player.rotation.y = Pointer.x;
  } else if (Perspective === "fp") {
    fpcam();
    player.visible = false;
  }
  playerMovement();

  PlayerLoad.Playeranimate();

  player.position.copy(
    new cannon.Vec3(
      playerBody.position.x,
      playerBody.position.y - 0.8,
      playerBody.position.z
    )
  );

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
//////////////////////////////////////////////////////
const GUI = document.getElementsByClassName("wrapper")[0];

document
  .getElementsByClassName("play")[0]
  .addEventListener("click", function () {
    if (loading === false) {
      play = true;
      GUI.style.display = "none";
      animate();
    } else {
      alert("The game is still Loading...");
    }
  });
