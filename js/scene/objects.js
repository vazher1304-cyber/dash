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

export function createLots(resources) {
  const group = new THREE.Group();
  const matrix = new THREE.Object3D();
  const positions = new Map();
  let entries = [], markers, tiles, islands;
  const highlight = new THREE.Mesh(resources.geometries.marker, resources.materials.highlight);
  highlight.visible = false; highlight.castShadow = true; group.add(highlight);
  function batch(geometry, material, count) {
    const mesh = new THREE.InstancedMesh(geometry, material, Math.max(1, count));
    mesh.count = count; mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); group.add(mesh); return mesh;
  }
  function place(mesh, index, x, y, z, w, h, d) {
    matrix.position.set(x, y, z); matrix.scale.set(w, h, d); matrix.updateMatrix(); mesh.setMatrixAt(index, matrix.matrix);
  }
  function clear() {
    [markers, tiles, islands].filter(Boolean).forEach(mesh => { group.remove(mesh); mesh.dispose(); });
    positions.clear(); highlight.visible = false;
  }
  function rebuild(snapshot) {
    clear(); entries = snapshot.lots;
    markers = batch(resources.geometries.marker, resources.materials.accent, entries.length);
    tiles = batch(resources.geometries.box, resources.materials.tile, entries.length);
    islands = batch(resources.geometries.box, resources.materials.island, snapshot.layout?.blocks.length || 0);
    markers.userData.entities = entries; tiles.userData.entities = entries;
    const layout = snapshot.layout;
    if (!layout) return;
    const x0 = Math.min(...layout.blocks.map(b => b.x));
    const x1 = Math.max(...layout.blocks.map(b => b.x + b.w));
    const z0 = Math.min(...layout.blocks.map(b => b.y));
    const z1 = Math.max(...layout.blocks.map(b => b.y + b.h));
    const unit = 20 / Math.max(x1 - x0, z1 - z0, 1);
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const byId = new Map(entries.map((e, i) => [e.id, i]));
    layout.blocks.forEach((block, index) => {
      place(islands, index, (block.x + block.w/2-cx)*unit, .03, (block.y+block.h/2-cz)*unit, (block.w+6)*unit, .15, (block.h+6)*unit);
      block.placed.forEach(({ l, x, y, w, h }) => {
        const i = byId.get(l.r._id); if (i === undefined) return;
        const entry = entries[i];
        entry.position = new THREE.Vector3((block.x+x+w/2-cx)*unit, .47, (block.y+y+h/2-cz)*unit);
        entry.width = w*unit*.9; entry.depth = h*unit*.9;
        entry.markerSize = Math.min(entry.width*1.4, .9);
        entry.index = i;
        // Instanced objects carry an individual DOM identity in userData.entities.
        entry.userData = { id: entry.id, selector: entry.selector };
        positions.set(entry.id, entry);
      });
    });
    entries.forEach(entry => updateEntry(entry));
    islands.instanceMatrix.needsUpdate = true;
    [markers, tiles, islands].forEach(mesh => { mesh.computeBoundingSphere(); });
  }
  function updateEntry(entry, scale = 1, bob = entry.bob || 0) {
    const { position: p, index: i } = entry; if (!p) return;
    place(tiles, i, p.x, .15, p.z, entry.width*scale, .15*scale, entry.depth*scale);
    place(markers, i, p.x, .3 + entry.markerSize*.35 + bob, p.z, entry.markerSize*scale, entry.markerSize*scale, entry.markerSize*scale);
    markers.setColorAt(i, new THREE.Color(entry.filtered ? '#ADB9CC' : entry.selected ? '#93BDFF' : '#FFFFFF'));
    markers.instanceMatrix.needsUpdate = true; tiles.instanceMatrix.needsUpdate = true;
    markers.instanceColor.needsUpdate = true;
  }
  function emphasize(hovered, pulsing, amount = 0) {
    entries.forEach(entry => {
      if (entry === hovered || entry.id === pulsing || entry.emphasized) {
        const scale = entry === hovered ? 1.08 : entry.id === pulsing ? 1 + amount*.1 : 1;
        updateEntry(entry, scale); entry.emphasized = scale !== 1;
      }
    });
    highlight.visible = !!hovered;
    if (hovered) {
      markers.getMatrixAt(hovered.index, highlight.matrix);
      highlight.matrix.decompose(highlight.position, highlight.quaternion, highlight.scale);
      highlight.scale.multiplyScalar(1.002);
    }
  }
  return { group, rebuild, positions, emphasize,
    get targets() { return markers ? [markers, tiles] : []; },
    get entries() { return entries; },
    animate(time, reduced) {
      entries.forEach((entry, index) => {
        entry.bob = reduced || entry.filtered ? 0 : Math.sin(time*.8 + index*.4)*.035;
        updateEntry(entry);
      });
    },
    dispose: clear
  };
}
