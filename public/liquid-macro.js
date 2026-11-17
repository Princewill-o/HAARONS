import * as THREE from './vendor/three.module.js';

const fraction = value => value - Math.floor(value);
const smooth = (value, start, end) => THREE.MathUtils.smoothstep(value, start, end);

export function createLiquidMacro(scene) {
 const chamber = new THREE.Group();
 chamber.visible = false;
 scene.add(chamber);

 const lightField = new THREE.ShaderMaterial({
  uniforms: { passage: { value: 0 } },
  vertexShader: `
   varying vec2 field;
   void main() {
    field = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
   }
  `,
  fragmentShader: `
   uniform float passage;
   varying vec2 field;
   void main() {
    vec2 p = field - vec2(.12, .18);
    float focus = exp(-dot(p * vec2(.38, .45), p * vec2(.38, .45)));
    float rays = sin(p.x * 2.7 + sin(p.y * 1.8 - passage * 2.)) * .5 + .5;
    float curvedBand = exp(-abs(p.y - 2.0 + .25 * p.x * p.x) * 9.);
    float outerRim = exp(-abs(length(p * vec2(.28, .39)) - 1.) * 15.);
    vec3 amber = mix(vec3(.055, .024, .013), vec3(.59, .32, .115), focus);
    amber += vec3(.17, .105, .049) * (rays * focus * .53 + curvedBand * .72 + outerRim * .33);
    gl_FragColor = vec4(amber, .55 + focus * .45);
   }
  `,
  transparent: true,
  depthWrite: false
 });
 const field = new THREE.Mesh(new THREE.PlaneGeometry(64, 48), lightField);
 field.position.z = -3.8;
 field.renderOrder = -1;
 chamber.add(field);

 const reflection = new THREE.MeshPhysicalMaterial({
  color: '#eebc77', roughness: .13, metalness: .42,
  transparent: true, opacity: .57, envMapIntensity: 2, depthWrite: false
 });
 const lip = new THREE.Group();
 chamber.add(lip);
 for (const [radius, thickness, depth] of [[1.04,.07,0],[1.2,.043,.1],[1.34,.035,.18]]) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, thickness, 8, 64), reflection);
  ring.position.z = depth;
  lip.add(ring);
 }

 const bubbleGeometry = new THREE.SphereGeometry(1, 14, 10);
 const bubbleMaterial = new THREE.ShaderMaterial({
  vertexShader: `
   varying vec3 facing;
   void main() {
    facing = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.);
   }
  `,
  fragmentShader: `
   varying vec3 facing;
   void main() {
    vec3 n = normalize(facing);
    float edge = pow(1. - abs(n.z), 2.4);
    float glint = pow(max(dot(n, normalize(vec3(-.65, .5, .55))), 0.), 27.);
    float mirror = pow(max(dot(n, normalize(vec3(.45, -.7, .55))), 0.), 19.);
    vec3 tint = mix(vec3(.14,.065,.022), vec3(1.,.84,.56), clamp(glint + mirror * .65, 0., 1.));
    gl_FragColor = vec4(tint, .07 + edge * .79 + glint * .81 + mirror * .48);
   }
  `,
  transparent: true, depthWrite: false
 });
 const bubbles = new THREE.InstancedMesh(bubbleGeometry, bubbleMaterial, 56);
 bubbles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
 bubbles.frustumCulled = false;
 bubbles.renderOrder = 2;
 chamber.add(bubbles);
 const dummy = new THREE.Object3D();

 const bergamot = new THREE.Group();
 const peel = new THREE.MeshStandardMaterial({color:'#8b5a29', roughness:.76});
 const pith = new THREE.MeshStandardMaterial({color:'#e5bd68', roughness:.69});
 const pulp = new THREE.MeshPhysicalMaterial({color:'#a6651e', roughness:.49, clearcoat:.36});
 for (const [radius, depth, material] of [[.49,.11,peel],[.456,.116,pith]]) {
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,depth,36),material);
  disc.rotation.x = Math.PI / 2;
  bergamot.add(disc);
 }
 for (let i = 0; i < 10; i++) {
  const segment = new THREE.Mesh(new THREE.CircleGeometry(.426, 7, i * Math.PI / 5 + .036, Math.PI / 5 - .072), pulp);
  segment.position.z = .061;
  bergamot.add(segment);
 }
 const slices = [bergamot, bergamot.clone()];
 chamber.add(...slices);

 const petalGeometry = new THREE.PlaneGeometry(1, 1, 16, 22);
 const vertices = petalGeometry.attributes.position;
 const colors = [];
 const base = new THREE.Color('#dbba92');
 const violet = new THREE.Color('#805783');
 const tip = new THREE.Color('#a86887');
 for (let i = 0; i < vertices.count; i++) {
  const x = vertices.getX(i) * 2;
  const y = vertices.getY(i) + .5;
  const width = Math.pow(Math.sin(Math.PI * y), .74) * (.64 + y * .36);
  vertices.setXYZ(i, x * width * .49, y - .5, x * x * width * .17 + y * y * .23 + Math.sin(x * 12 + y * 8) * .033 * y);
  const hue = base.clone().lerp(violet, smooth(y, .0, .46)).lerp(tip, smooth(Math.abs(x), .32, 1) * y);
  colors.push(hue.r, hue.g, hue.b);
 }
 petalGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
 petalGeometry.computeVertexNormals();
 const petalMaterial = new THREE.MeshPhysicalMaterial({
  vertexColors: true, side: THREE.DoubleSide, roughness:.64, clearcoat:.22
 });
 const petals = Array.from({length:5}, () => new THREE.Mesh(petalGeometry, petalMaterial));
 chamber.add(...petals);

 const grain = new THREE.MeshStandardMaterial({color:'#452515', roughness:.84, flatShading:true});
 const shards = Array.from({length:13}, (_, i) => {
  const shape = new THREE.Shape();
  shape.moveTo(-.05,-.46);
  shape.lineTo(.046,-.59);
  shape.lineTo(.082,-.22);
  shape.lineTo(.045,.16);
  shape.lineTo(.07,.5);
  shape.lineTo(.008,.61);
  shape.lineTo(-.076,.29);
  shape.lineTo(-.095,-.12);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {depth:.04 + i % 3 * .012, bevelEnabled:true, bevelSize:.013, bevelThickness:.016, bevelSegments:1});
  return new THREE.Mesh(geometry,grain);
 });
 chamber.add(...shards);

 function update(progress) {
  lightField.uniforms.passage.value = progress;
  lip.position.set(0, -.05, .82 + smooth(progress, .035, .32) * 4.6);
  lip.rotation.x = -.22 + progress * .6;
  lip.visible = progress < .32;
  for (let i = 0; i < bubbles.count; i++) {
   const spread = fraction(i * .618034);
   const height = fraction(i * .37139);
   const radius = .025 + fraction(i * .271828) ** 2 * .083;
   dummy.position.set((spread - .5) * 10 + Math.sin(i + progress * 4) * .16, (height - .47) * 6 + progress * .95, -2.2 + fraction(i * .41421) * 4);
   dummy.scale.set(radius, radius * (1.02 + spread * .13), radius);
   dummy.updateMatrix();
   bubbles.setMatrixAt(i, dummy.matrix);
  }
  bubbles.instanceMatrix.needsUpdate = true;

  slices.forEach((slice, i) => {
   slice.position.set(-1.65 + i * 2.65 + progress * .6, 2.45 - smooth(progress, 0, .18) * 1.55 + smooth(progress,.43,.7) * 3, -.6 + i * .45);
   slice.rotation.set(-.32 + progress, -.27 + i * .54, progress + i * .4);
   slice.scale.setScalar(1.08 + i * .23);
  });
  petals.forEach((petal, i) => {
   const entry = smooth(progress, .22 + i * .025, .56 + i * .022);
   const across = fraction(i * .619) * 4.3 - 1.88;
   petal.position.set(across + Math.sin(progress * 3 + i) * .32, -3.5 + entry * (3.1 + fraction(i * .37) * 2.3) - smooth(progress,.72,.98) * (1 + i % 3), -.64 + i * .41);
   petal.rotation.set(.32 + i * .31 + progress, -.39 + i * .26, -.7 + i * .43 + progress * .85);
   petal.scale.setScalar(.68 + fraction(i * .71) * .86);
  });
  shards.forEach((shard, i) => {
   const entry = smooth(progress, .54 + i % 5 * .021, .85 + i % 3 * .025);
   const x = (fraction(i * .641) - .46) * 7.5;
   shard.position.set(x + (1 - entry) * (i % 2 ? 4 : -4), (fraction(i * .492) - .43) * 4.5 + (1 - entry) * 4.4, -1.25 + fraction(i * .733) * 2.8);
   shard.rotation.set(i * .44 + progress, i * .38, i * 1.21 + progress * 1.2);
   shard.scale.setScalar(.38 + fraction(i * .386) * 1.24);
  });
 }

 return { chamber, update };
}
