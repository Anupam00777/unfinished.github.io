import { OBJLoader } from "./OBJLoader.js";
import { GLTFLoader } from "./GLTFLoader.js";
import { MTLLoader } from "./MTLLoader.js";
import { threeToCannon, ShapeType } from "./three-to-cannon.modern.js";

class objectLoader {
  constructor() {}
  loadobj(path, obj, mtl, callback) {
    new MTLLoader().setPath(path).load(mtl + ".mtl", function (materials) {
      materials.preload();

      new OBJLoader()
        .setMaterials(materials)
        .setPath(path)
        .load(obj + ".obj", function (object) {
          callback(object);
        });
    });
  }
  boundLoad(object, p, callback) {
    const object3d = threeToCannon(object, { type: ShapeType.HULL });
    const { shape, offset, quaternion } = object3d;
    const body = new cannon.Body({
      shape: shape,
      mass: 0,
      material: cm2,
      offset: offset,
      position: p,
      orientation: quaternion,
    });
    callback(body);
  }
}
class gltfLoader {
  constructor() {}

  gltfLoad(objectPath, callback) {
    const gloader = new GLTFLoader();
    gloader.load(objectPath, function (gltf) {
      let variableForModel = gltf.scene;
      variableForModel.castShadow = true;

      variableForModel.traverse(function (object) {
        if (object.isMesh) object.castShadow = true;
      });
      callback(variableForModel, gltf);
    });
  }
}
export { objectLoader, gltfLoader };
