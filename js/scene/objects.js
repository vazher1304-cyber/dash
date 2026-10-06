import * as THREE from 'three';

export function createResources() {
  const geometries = {
    box: new THREE.BoxGeometry(1, 1, 1),
    cone: new THREE.ConeGeometry(.55, 1.3, 5),
    trunk: new THREE.CylinderGeometry(.07, .11, .6, 6),
    marker: new THREE.CylinderGeometry(.22, .3, .7, 6)
  };
  const material = color => new THREE.MeshStandardMaterial({ color, roughness: .86, metalness: 0 });
  const materials = {
    ground: material('#E5EBF1'), island: material('#F8FAFC'), path: material('#D3DCE7'),
    foliage: material('#B2C7B9'), trunk: material('#A9A99D'), prop: material('#AAB6C6'),
    tile: material('#DDE6F2'), accent: material('#2F6BFF'),
    highlight: new THREE.MeshStandardMaterial({ color: '#2F6BFF', emissive: '#2F6BFF', emissiveIntensity: .35, roughness: .8 })
  };
  return { geometries, materials, dispose() {
    Object.values(geometries).forEach(g => g.dispose());
    Object.values(materials).forEach(m => m.dispose());
  } };
}

export function createContext(resources) {
  const group = new THREE.Group();
  const mesh = (geometry, material, position, scale) => {
    const item = new THREE.Mesh(geometry, material);
    item.position.set(...position); item.scale.set(...scale);
    item.castShadow = true; item.receiveShadow = true; group.add(item); return item;
  };
  const { geometries: g, materials: m } = resources;
  mesh(g.box, m.ground, [0, -.28, 0], [27, .4, 27]);
  mesh(g.box, m.path, [0, -.06, 0], [1.2, .025, 25]);
  const trees = [[-12, -8], [-12, 0], [-12, 8], [12, -8], [12, 0], [12, 8]];
  trees.forEach(([x, z]) => {
    mesh(g.trunk, m.trunk, [x, .24, z], [1, 1, 1]);
    mesh(g.cone, m.foliage, [x, 1, z], [1, 1, 1]);
  });
  const prop = mesh(g.box, m.prop, [0, .14, -10], [.3, .25, .65]);
  return { group, prop };
}
