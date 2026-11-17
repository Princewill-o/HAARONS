import * as THREE from './vendor/three.module.js';
import { getJourneyState } from './journey-model.mjs';
import { createLiquidMacro } from './liquid-macro.js';

// A real procedural model: no video, billboards or remote 3D asset service.
export function createBottle3D(host, journey, motion) {
 let renderer;
 const canvas = document.createElement('canvas');
 try {
  const context=canvas.getContext('webgl2',{alpha:true,antialias:true,powerPreference:'low-power'});
  if(!context){host.dataset.renderer='fallback';return null;}
  renderer = new THREE.WebGLRenderer({canvas,context,alpha:true,antialias:true,powerPreference:'low-power'});
 } catch { host.dataset.renderer = 'fallback'; return null; }
 canvas.className = 'bottle-webgl';
 canvas.setAttribute('aria-hidden','true');
 renderer.setClearColor(0,0);
 renderer.localClippingEnabled = true;
 renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 721 ? 1.15 : 1.5));
 renderer.transmissionResolutionScale = .5;
 renderer.toneMapping = THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure = 1.1;
 const stage = host.closest('.journey-stage');
 stage.append(canvas);
 const scene = new THREE.Scene();
 const camera = new THREE.PerspectiveCamera(34,1,0.1,80);
 camera.position.set(0,.16,10.2);
 camera.lookAt(0,.16,0);
 const model = new THREE.Group();
 scene.add(model);
 const macro = createLiquidMacro(scene);

 // A small, local studio environment gives glass and lacquer real reflections.
 const studio = document.createElement('canvas');studio.width=1024;studio.height=512;
 const studioContext = studio.getContext('2d');
 studioContext.fillStyle='#302a29';studioContext.fillRect(0,0,1024,512);
 const lightBand=(x,w,color)=>{
  const glow=studioContext.createLinearGradient(x-w,0,x+w,0);
  glow.addColorStop(0,'#302a29');glow.addColorStop(.4,color);glow.addColorStop(.6,color);glow.addColorStop(1,'#302a29');
  studioContext.fillStyle=glow;studioContext.fillRect(x-w,0,w*2,512);
 };
 lightBand(110,40,'#fff5df');lightBand(440,100,'#e8d9c9');lightBand(780,26,'#ffffff');
 const studioTexture=new THREE.CanvasTexture(studio);
 studioTexture.mapping=THREE.EquirectangularReflectionMapping;
 studioTexture.colorSpace=THREE.SRGBColorSpace;
 const pmrem=new THREE.PMREMGenerator(renderer);
 const environment=pmrem.fromEquirectangular(studioTexture);
 scene.environment=environment.texture;
 studioTexture.dispose();pmrem.dispose();
 scene.add(new THREE.HemisphereLight('#fff1d8','#24120c',.95));
 const key = new THREE.SpotLight('#ffe0ad',42,18,Math.PI/5,.72,1.5);key.position.set(-3.8,5.2,5.5);key.target.position.set(0,0,0);scene.add(key,key.target);
 const front = new THREE.DirectionalLight('#fff0d6',1.35);front.position.set(-1,1,6);scene.add(front);
 const rim = new THREE.SpotLight('#f1bf82',34,16,Math.PI/4,.8,1.5);rim.position.set(3.2,3.5,-3.5);rim.target.position.set(0,.2,0);scene.add(rim,rim.target);
 const edge = new THREE.PointLight('#f4a94f',7,8,2);edge.position.set(1.3,-1.1,2.8);scene.add(edge);
 const fill = new THREE.DirectionalLight('#efb165',1.4);fill.position.set(2,-1,3);scene.add(fill);
 const gold = new THREE.MeshStandardMaterial({color:'#d9aa52',metalness:.9,roughness:.2});
 const glass = new THREE.MeshPhysicalMaterial({color:'#fff9ed',metalness:0,roughness:.025,transmission:1,transparent:true,opacity:.2,thickness:.22,ior:1.48,envMapIntensity:1.45,clearcoat:1,clearcoatRoughness:.04});
 const glassBase = new THREE.MeshPhysicalMaterial({color:'#fff2d9',roughness:.035,transmission:.95,transparent:true,opacity:.2,thickness:.4,ior:1.5,envMapIntensity:1.3});
 const amber = new THREE.MeshPhysicalMaterial({color:'#d49a43',roughness:.055,metalness:0,transmission:.38,transparent:true,opacity:.9,clearcoat:1,clearcoatRoughness:.02,thickness:.9,ior:1.38,attenuationColor:new THREE.Color('#d98b2b'),attenuationDistance:.55,envMapIntensity:2});
 const burgundy = new THREE.MeshPhysicalMaterial({color:'#3c051e',metalness:.6,roughness:.2,clearcoat:1,clearcoatRoughness:.09,envMapIntensity:1.8});
 const segments=window.innerWidth<721?48:80;
 const lathe=(profile,material,parent=model)=>{
  const mesh=new THREE.Mesh(new THREE.LatheGeometry(profile.map(([r,y])=>new THREE.Vector2(r,y)),segments),material);
  parent.add(mesh);return mesh;
 };
 // The rounded shoulder, cylindrical body and heavy heel follow the supplied bottle.
 lathe([[0,-2.1],[.66,-2.1],[.78,-2.08],[.85,-2.01],[.87,-1.92],[.87,.74],[.85,.9],[.79,1.01],[.61,1.09],[.4,1.15],[.39,1.24],[0,1.24]],glass);
 lathe([[0,-2.09],[.69,-2.09],[.81,-2.03],[.845,-1.98],[.845,-1.75],[.79,-1.7],[0,-1.7]],glassBase);
 const neckGlass = new THREE.MeshPhysicalMaterial({
  color:'#fff2d7', roughness:.08, metalness:.24, transparent:true, opacity:.55,
  envMapIntensity:2.1, depthWrite:false, clearcoat:1
 });
 lathe([[.41,1.065],[.44,1.09],[.45,1.117],[.435,1.134],[.421,1.148],[.425,1.162],[.414,1.18],[.399,1.19]],neckGlass);
 // The volume is clipped by a world-space plane so the fill stays under gravity
 // while the glass turns. A separate surface mesh gives the meniscus a clean sheen.
 const fillLevel=.34;
 const liquidRadius=.805;
 lathe([[0,-1.72],[.76,-1.72],[liquidRadius,-1.64],[liquidRadius,.73],[0,.73]],amber);
 const waterlineNormal=new THREE.Vector3(0,1,0);
 amber.clippingPlanes=[new THREE.Plane(waterlineNormal.clone(),-fillLevel)];
 const meniscusMaterial=amber.clone();meniscusMaterial.clippingPlanes=[];
 const surfaceGeometry = new THREE.CircleGeometry(liquidRadius,segments);
 const surfaceVertices = surfaceGeometry.attributes.position;
 const surfaceRim = Array.from({length:segments+1}, (_, i) => [
  liquidRadius * Math.cos(i / segments * Math.PI * 2),
  -liquidRadius * Math.sin(i / segments * Math.PI * 2)
 ]);
 const liquidSurface = new THREE.Mesh(surfaceGeometry,meniscusMaterial);
 liquidSurface.frustumCulled=false;
 model.add(liquidSurface);
 const tube = new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,2.8,8),new THREE.MeshPhysicalMaterial({color:'#f8d89b',transparent:true,opacity:.45,roughness:.2}));
 tube.position.set(.03,-.36,.1);tube.rotation.z=-.03;model.add(tube);
 lathe([[0,1.14],[.38,1.14],[.4,1.18],[.4,1.3],[0,1.3]],gold);
 const pump=new THREE.Group();pump.position.y=1.27;model.add(pump);
 lathe([[0,0],[.235,0],[.245,.03],[.245,.31],[.22,.34],[0,.34]],gold,pump);
 const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.025,16),new THREE.MeshStandardMaterial({color:'#241811',roughness:.6}));
 nozzle.rotation.z=Math.PI/2;nozzle.position.set(.245,.21,0);pump.add(nozzle);
 const cap=new THREE.Group();cap.position.y=1.22;model.add(cap);
 lathe([[0,0],[.54,0],[.58,.02],[.59,.07],[.59,1.02],[.57,1.07],[.51,1.085],[0,1.085]],burgundy,cap);
 const capRim=new THREE.Mesh(new THREE.TorusGeometry(.565,.012,8,segments),burgundy);
 capRim.rotation.x=Math.PI/2;capRim.position.y=.025;cap.add(capRim);

 // The wraparound paper label remains legible while the bottle turns in depth.
 const labelCanvas=document.createElement('canvas');labelCanvas.width=768;labelCanvas.height=1024;
 const ctx=labelCanvas.getContext('2d');ctx.fillStyle='#eee1c8';ctx.fillRect(0,0,768,1024);
 for(let i=0;i<4500;i++){
  ctx.fillStyle=i%2?'rgba(109,78,43,.035)':'rgba(255,255,255,.11)';
  ctx.fillRect((i*149)%768,(i*79)%1024,1+(i%2),1);
 }
 ctx.strokeStyle='#fff4e2';ctx.lineWidth=5;ctx.strokeRect(3,3,762,1018);
 ctx.textAlign='center';ctx.fillStyle='#29201c';
 ctx.font='70px Georgia';ctx.letterSpacing='5px';ctx.fillText('H.AARONS',384,195);
 ctx.letterSpacing='3px';ctx.font='38px Arial';ctx.fillText('No.01',384,514);
 ctx.letterSpacing='4px';ctx.font='42px Arial';ctx.fillText('RHAPSODY',384,575);
 ctx.letterSpacing='3px';ctx.font='27px Arial';ctx.fillText('EAU DE PARFUM',384,923);
 const labelTexture=new THREE.CanvasTexture(labelCanvas);labelTexture.colorSpace=THREE.SRGBColorSpace;
 labelTexture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 const label=new THREE.Mesh(new THREE.CylinderGeometry(.88,.88,1.9,40,1,true,-.79,1.58),new THREE.MeshBasicMaterial({map:labelTexture,side:THREE.DoubleSide,toneMapped:false}));
 label.position.y=-.33;model.add(label);

 let target=getJourneyState(0), scrollVelocity=0, previousProgress=0, paintedProgress=0;
 let visible=true, disposed=false, frame=0, lastTime=0, replayStart=-100;
 const sprayShot=getJourneyState(.49);
 const pointer={x:0,y:0};const smoothPointer={x:0,y:0};
 let currentYaw=-.20,currentRoll=-.104,currentPitch=.02,currentCap=0,sloshX=0,sloshZ=0,previousRoll=-.104,previousPitch=.02;
 let canvasWidth=1,canvasHeight=1, framingDirty=true;
 let bottleX=0,bottleY=0,bottleWidth=0,bottleHeight=0,wasInside=false;
 let cameraDistance=10.2, cameraFocus=.16, cameraElevation=.04;
 const mist=host.querySelector('.mist-origin');
 const emitter=new THREE.Vector3();
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const surfaceNormal=new THREE.Vector3();
 const localNormal=new THREE.Vector3();
 const inverseRotation=new THREE.Quaternion();
 const waterlinePoint=new THREE.Vector3();
 const clipNormal=new THREE.Vector3();
 function resize(){
  canvasWidth=stage.clientWidth;canvasHeight=stage.clientHeight;
  if(!canvasWidth||!canvasHeight)return;
  renderer.setSize(canvasWidth,canvasHeight,false);
  framingDirty=true;
  wake();
 }
 function render(time){
  frame=0;
  if(disposed||!visible||document.hidden||!canvasWidth||!canvasHeight)return;
  // Limit expensive transmission rendering to 30fps; motion uses elapsed time.
  if(lastTime&&time-lastTime<30){wake();return;}
  const delta=Math.min(.08,(time-lastTime)/1000||.016);lastTime=time;
  const damping=1-Math.exp(-delta*9);
  const reduced=motion.matches;
  const replayAge=time-replayStart;
  const replaying=!reduced&&replayAge>=0&&replayAge<1400;
  const pose=replaying&&target.inside ? sprayShot : target;
  const inside=!reduced&&Boolean(pose.inside);
  const jumped=Math.abs(previousProgress-paintedProgress)>.075;
  const dampingPose=reduced||inside!==wasInside||jumped ? 1 : damping;
  paintedProgress=previousProgress;
  if(framingDirty||inside!==wasInside){
   bottleX=host.offsetLeft;
   bottleY=host.offsetTop;
   bottleWidth=host.offsetWidth;
   bottleHeight=host.offsetHeight * 1.28;
   const centerX=inside ? canvasWidth*.5+(bottleX-canvasWidth*.5)*.65 : bottleX;
   const centerY=inside ? canvasHeight*.54 : bottleY;
   const frameHeight=inside ? canvasHeight : Math.max(1,bottleHeight);
   camera.setViewOffset(canvasWidth,frameHeight,canvasWidth*.5-centerX,frameHeight*.5-centerY,canvasWidth,canvasHeight);
   framingDirty=false;
  }
  wasInside=inside;
  model.visible=!inside;
  macro.chamber.visible=inside;
  stage.classList.toggle('liquid-closeup',inside);
  stage.classList.toggle('neck-closeup',!inside&&!reduced&&pose.distance<6);
  stage.style.setProperty('--lens-dissolve',replaying ? 0 : target.dissolve);
  if(inside){
   const passage=target.macroProgress;
   macro.chamber.rotation.z=Math.sin(passage*Math.PI*1.3)*.16;
   macro.update(passage);
   camera.position.set(passage*.55,.06-passage*.2,4.55-passage*1.38);
   camera.lookAt(passage*.35,.03,0);
   renderer.render(scene,camera);
   return;
  }
  const yaw=pose.yaw;
  const roll=pose.rotation*Math.PI/180;
  const pitch=reduced ? 0 : .025;
  currentYaw+=(yaw-currentYaw)*dampingPose;currentRoll+=(roll-currentRoll)*dampingPose;currentPitch+=(pitch-currentPitch)*dampingPose;
  currentCap+=(pose.capLift-currentCap)*dampingPose;
  if(reduced){currentYaw=yaw;currentRoll=0;currentPitch=0;currentCap=0;}
  smoothPointer.x+=(pointer.x-smoothPointer.x)*damping;smoothPointer.y+=(pointer.y-smoothPointer.y)*damping;
  const parallax=reduced ? 0 : THREE.MathUtils.smoothstep(pose.distance,4.5,10);
  model.rotation.set(currentPitch+smoothPointer.y*.045*parallax,currentYaw+smoothPointer.x*.10*parallax,currentRoll);
  model.position.y=0;
  const rotationSpeedX=(model.rotation.x-previousPitch)/Math.max(delta,.001);
  const rotationSpeedZ=(model.rotation.z-previousRoll)/Math.max(delta,.001);
  previousPitch=model.rotation.x;previousRoll=model.rotation.z;
  const sloshDamping=1-Math.exp(-delta*3.2);
  sloshX=reduced ? 0 : THREE.MathUtils.lerp(sloshX,clamp(-rotationSpeedX*.018,-.055,.055),sloshDamping);
  sloshZ=reduced ? 0 : THREE.MathUtils.lerp(sloshZ,clamp(-rotationSpeedZ*.018-scrollVelocity*.025,-.055,.055),sloshDamping);
  const sweep=THREE.MathUtils.smoothstep(currentCap,.22,1);
  cap.position.set(sweep*1.46,1.22+currentCap*.98+sweep*.6,sweep*.35);
  cap.rotation.set(sweep*.32,sweep*.4,sweep*-.72);
  const replay=replaying ? Math.max(0,1-replayAge/650) : 0;
  pump.position.y=1.27-(reduced ? 0 : Math.max(replaying ? 0 : pose.press,Math.sin(replay*Math.PI))*.1);
  surfaceNormal.set(sloshX,1,sloshZ).normalize();
  waterlinePoint.set(0,fillLevel,0);
  amber.clippingPlanes[0].setFromNormalAndCoplanarPoint(clipNormal.copy(surfaceNormal).negate(),waterlinePoint);
  inverseRotation.copy(model.quaternion).invert();
  localNormal.copy(surfaceNormal).applyQuaternion(inverseRotation);
  // Intersect the tilted cylinder with the liquid plane to keep the rim sealed.
  surfaceVertices.setXYZ(0,0,fillLevel/localNormal.y,0);
  surfaceRim.forEach(([x,z],i)=>{
   const y=(fillLevel-localNormal.x*x-localNormal.z*z)/localNormal.y;
   surfaceVertices.setXYZ(i+1,x,y,z);
  });
  surfaceVertices.needsUpdate=true;
  surfaceGeometry.computeVertexNormals();
  scrollVelocity*=Math.exp(-delta*7);
  cameraDistance=THREE.MathUtils.lerp(cameraDistance,pose.distance,dampingPose);
  cameraFocus=THREE.MathUtils.lerp(cameraFocus,pose.focus,dampingPose);
  cameraElevation=THREE.MathUtils.lerp(cameraElevation,pose.elevation,dampingPose);
  camera.position.set(0,cameraFocus+Math.sin(cameraElevation)*cameraDistance,Math.cos(cameraElevation)*cameraDistance);
  camera.lookAt(0,cameraFocus,0);
  renderer.render(scene,camera);
  // Attach the CSS plume to the actual 3D nozzle in screen space.
  nozzle.getWorldPosition(emitter);emitter.project(camera);
  mist.style.left=`${(emitter.x*.5+.5)*canvasWidth-bottleX+bottleWidth*.5}px`;
  mist.style.top=`${(-emitter.y*.5+.5)*canvasHeight-bottleY+bottleHeight/2.56}px`;
  if(host.dataset.renderer!=='webgl'){host.dataset.renderer='webgl';host.classList.add('webgl-ready');}
  if(!reduced)wake();
 }
 function wake(){if(!frame&&!disposed&&visible&&!document.hidden)frame=requestAnimationFrame(render);}
 const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);resizeObserver.observe(stage);
 const visibilityObserver=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible){lastTime=0;wake();}},{rootMargin:'80px'});visibilityObserver.observe(journey);
 const move=event=>{if(event.pointerType==='touch'||motion.matches)return;pointer.x=event.clientX/window.innerWidth*2-1;pointer.y=event.clientY/window.innerHeight*2-1;wake();};
 const visibility=()=>{if(!document.hidden){lastTime=0;wake();}};
 window.addEventListener('pointermove',move,{passive:true});
 document.addEventListener('visibilitychange',visibility);
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();dispose();host.dataset.renderer='fallback';});
 function dispose(){
  disposed=true;cancelAnimationFrame(frame);resizeObserver.disconnect();visibilityObserver.disconnect();
  window.removeEventListener('pointermove',move);document.removeEventListener('visibilitychange',visibility);
  scene.traverse(object=>{object.geometry?.dispose();if(object.material){const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(material=>material.dispose());}});
  labelTexture.dispose();environment.dispose();renderer.dispose();canvas.remove();host.classList.remove('webgl-ready');
  stage.classList.remove('liquid-closeup','neck-closeup');stage.style.removeProperty('--lens-dissolve');
 }
 window.addEventListener('pagehide',event=>{if(!event.persisted)dispose();},{once:true});
 resize();
 return {
  update(state,p){target=state;scrollVelocity+=(p-previousProgress)*8;previousProgress=p;framingDirty=true;wake();},
  replay(){replayStart=performance.now();wake();},
  dispose
 };
}
