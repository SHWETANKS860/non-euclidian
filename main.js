// Main variables
let camera, scene, renderer, world;
let playerBody, playerCollider;
let controls = {
  moveForward: false,
  moveBackward: false,
  moveLeft: false,
  moveRight: false,
  canJump: false,
  isDashing: false,
  dashCooldown: false
};

// Portal system
let portals = [];
let portalConfigs = [
  {
    positions: [
      { from: new THREE.Vector3(-10, 2, 0), to: new THREE.Vector3(10, 2, 0), rotation: Math.PI },
      { from: new THREE.Vector3(0, 2, -10), to: new THREE.Vector3(0, 2, 10), rotation: Math.PI }
    ],
    color1: 0x00aaff,
    color2: 0xff5500
  },
  {
    positions: [
      { from: new THREE.Vector3(-5, 2, -5), to: new THREE.Vector3(5, 10, 5), rotation: Math.PI/2 },
      { from: new THREE.Vector3(5, 2, 5), to: new THREE.Vector3(-5, 10, -5), rotation: -Math.PI/2 }
    ],
    color1: 0x00ff00,
    color2: 0xff00ff
  }
];
let currentPortalConfig = 0;

// Physics objects
let physicsBodies = [];
let physicsObjects = [];

// Camera controls
let yawObject, pitchObject;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let moveSpeed = 15; // Increased base movement speed
let dashSpeed = 50; // Dash speed multiplier
let dashDuration = 200; // Dash duration in milliseconds
let dashCooldownTime = 1500; // Dash cooldown in milliseconds

// Initialize everything
init();
animate();

function init() {
  // Physics world
  world = new CANNON.World();
  world.gravity.set(0, -9.82, 0);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 10;
  
  // Three.js scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000011);
  scene.fog = new THREE.Fog(0x000011, 0, 50);
  
  // Camera and controls
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  
  // First person controls
  pitchObject = new THREE.Object3D();
  pitchObject.add(camera);
  
  yawObject = new THREE.Object3D();
  yawObject.position.y = 2;
  yawObject.add(pitchObject);
  scene.add(yawObject);
  
  // Physics body for player
  const playerShape = new CANNON.Sphere(0.5);
  playerBody = new CANNON.Body({
    mass: 5,
    position: new CANNON.Vec3(0, 3, 0),
    shape: playerShape,
    linearDamping: 0.7 // Reduced damping for smoother movement
  });
  playerBody.addEventListener('collide', function() {
    controls.canJump = true;
  });
  world.addBody(playerBody);
  
  // Visual representation of player
  playerCollider = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, visible: false })
  );
  scene.add(playerCollider);
  
  // Create the ground
  createGround();
  
  // Create walls
  createWalls();
  
  // Create portals
  createPortals(portalConfigs[currentPortalConfig]);
  
  // Light
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);
  
  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);
  
  // Event listeners
  document.addEventListener('mousedown', function() {
    document.body.requestPointerLock();
  });
  
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  
  document.getElementById('toggleGravity').addEventListener('click', toggleGravity);
  document.getElementById('spawnCube').addEventListener('click', spawnCube);
  document.getElementById('changeWorld').addEventListener('click', changePortalConfig);
  
  // Window resize
  window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Update info text to include dash instructions
  document.querySelector('#info p').innerHTML = 'Move: WASD | Jump: Space | Dash: Shift | Look: Mouse';
}

function createGround() {
  // Physics ground
  const groundShape = new CANNON.Plane();
  const groundBody = new CANNON.Body({
    mass: 0,
    shape: groundShape
  });
  groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
  world.addBody(groundBody);
  
  // Visual ground
  const groundGeometry = new THREE.PlaneGeometry(100, 100, 20, 20);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x223344,
    wireframe: false,
    side: THREE.DoubleSide
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  
  // Add a grid for reference
  const grid = new THREE.GridHelper(100, 100, 0xffffff, 0x555555);
  scene.add(grid);
}

function createWalls() {
  // Create boundary walls
  const wallGeometry = new THREE.BoxGeometry(1, 5, 20);
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x445566 });
  
  // Create and position walls
  const walls = [
    { pos: new THREE.Vector3(-15, 2.5, 0), rot: new THREE.Euler(0, 0, 0) },
    { pos: new THREE.Vector3(15, 2.5, 0), rot: new THREE.Euler(0, 0, 0) },
    { pos: new THREE.Vector3(0, 2.5, -15), rot: new THREE.Euler(0, Math.PI/2, 0) },
    { pos: new THREE.Vector3(0, 2.5, 15), rot: new THREE.Euler(0, Math.PI/2, 0) }
  ];
  
  walls.forEach(wallConfig => {
    // Visual wall
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.copy(wallConfig.pos);
    wall.rotation.copy(wallConfig.rot);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
    
    // Physics wall
    const wallShape = new CANNON.Box(new CANNON.Vec3(0.5, 2.5, 10));
    const wallBody = new CANNON.Body({
      mass: 0,
      shape: wallShape,
      position: new CANNON.Vec3(wallConfig.pos.x, wallConfig.pos.y, wallConfig.pos.z)
    });
    
    if (wallConfig.rot.y !== 0) {
      wallBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), wallConfig.rot.y);
    }
    
    world.addBody(wallBody);
  });
}

function createPortals(config) {
  // Remove existing portals
  portals.forEach(portal => {
    scene.remove(portal.mesh);
  });
  portals = [];
  
  // Create new portals based on config
  for (let i = 0; i < config.positions.length; i += 2) {
    const fromPos = config.positions[i].from;
    const toPos = config.positions[i+1].to;
    const fromRot = config.positions[i].rotation || 0;
    const toRot = config.positions[i+1].rotation || 0;
    
    createPortalPair(fromPos, toPos, fromRot, toRot, config.color1, config.color2);
  }
}

function createPortalPair(posA, posB, rotA, rotB, colorA, colorB) {
  // Create portal geometries
  const portalGeometry = new THREE.RingGeometry(0.8, 1, 32);
  
  // Create portal materials
  const materialA = new THREE.MeshBasicMaterial({ 
    color: colorA,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8
  });
  
  const materialB = new THREE.MeshBasicMaterial({ 
    color: colorB,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8
  });
  
  // Create portal meshes
  const portalA = new THREE.Mesh(portalGeometry, materialA);
  portalA.position.copy(posA);
  portalA.lookAt(posA.x, posA.y, posA.z - 1);
  if (rotA) portalA.rotateY(rotA);
  scene.add(portalA);
  
  const portalB = new THREE.Mesh(portalGeometry, materialB);
  portalB.position.copy(posB);
  portalB.lookAt(posB.x, posB.y, posB.z - 1);
  if (rotB) portalB.rotateY(rotB);
  scene.add(portalB);
  
  // Store portal pair
  portals.push({
    mesh: portalA,
    destination: posB,
    destinationRotation: rotB,
    radius: 1,
    active: true
  });
  
  portals.push({
    mesh: portalB,
    destination: posA,
    destinationRotation: rotA,
    radius: 1,
    active: true
  });
}

function spawnCube() {
  const size = 0.5 + Math.random() * 0.5;
  
  // Create physics body
  const cubeShape = new CANNON.Box(new CANNON.Vec3(size/2, size/2, size/2));
  const cubeBody = new CANNON.Body({
    mass: 1,
    shape: cubeShape,
    position: new CANNON.Vec3(
      yawObject.position.x + (Math.random() * 2 - 1),
      yawObject.position.y + 1,
      yawObject.position.z + (Math.random() * 2 - 1)
    ),
    linearDamping: 0.1,
    angularDamping: 0.1
  });
  
  world.addBody(cubeBody);
  physicsBodies.push(cubeBody);
  
  // Create visual object
  const cubeGeometry = new THREE.BoxGeometry(size, size, size);
  const cubeMaterial = new THREE.MeshStandardMaterial({
    color: Math.random() * 0xffffff,
    roughness: 0.7,
    metalness: 0.2
  });
  
  const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  cube.castShadow = true;
  cube.receiveShadow = true;
  scene.add(cube);
  physicsObjects.push(cube);
  
  // Limit number of cubes to prevent performance issues
  if (physicsBodies.length > 30) {
    world.remove(physicsBodies[0]);
    scene.remove(physicsObjects[0]);
    physicsBodies.shift();
    physicsObjects.shift();
  }
}

function toggleGravity() {
  world.gravity.y = world.gravity.y === -9.82 ? 9.82 : -9.82;
}

function changePortalConfig() {
  currentPortalConfig = (currentPortalConfig + 1) % portalConfigs.length;
  createPortals(portalConfigs[currentPortalConfig]);
}

function checkPortals() {
  // Check if player is near any portal
  portals.forEach(portal => {
    if (!portal.active) return;
    
    const distance = portal.mesh.position.distanceTo(yawObject.position);
    
    if (distance < portal.radius) {
      // Teleport player
      yawObject.position.copy(portal.destination);
      
      // Apply rotation offset
      if (portal.destinationRotation) {
        yawObject.rotation.y += portal.destinationRotation;
      }
      
      // Update physics body
      playerBody.position.x = yawObject.position.x;
      playerBody.position.y = yawObject.position.y;
      playerBody.position.z = yawObject.position.z;
      
      // Deactivate portal briefly to prevent back-and-forth teleporting
      portal.active = false;
      setTimeout(() => {
        portal.active = true;
      }, 1000);
    }
  });
  
  // Check if any physics objects are near portals
  for (let i = 0; i < physicsObjects.length; i++) {
    const obj = physicsObjects[i];
    const body = physicsBodies[i];
    
    portals.forEach(portal => {
      if (!portal.active) return;
      
      const distance = portal.mesh.position.distanceTo(obj.position);
      
      if (distance < portal.radius) {
        // Teleport object
        body.position.x = portal.destination.x;
        body.position.y = portal.destination.y;
        body.position.z = portal.destination.z;
        
        // Deactivate portal briefly for this object
        portal.active = false;
        setTimeout(() => {
          portal.active = true;
        }, 500);
      }
    });
  }
}

function onMouseMove(event) {
  if (document.pointerLockElement === document.body) {
    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;
    
    yawObject.rotation.y -= movementX * 0.002;
    pitchObject.rotation.x -= movementY * 0.002;
    
    // Clamp vertical look
    pitchObject.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitchObject.rotation.x));
  }
}

function onKeyDown(event) {
  switch (event.code) {
    case 'KeyW':
      controls.moveForward = true;
      break;
    case 'KeyA':
      controls.moveLeft = true;
      break;
    case 'KeyS':
      controls.moveBackward = true;
      break;
    case 'KeyD':
      controls.moveRight = true;
      break;
    case 'Space':
      if (controls.canJump) {
        playerBody.velocity.y = 7; // Increased jump height
        controls.canJump = false;
      }
      break;
    case 'ShiftLeft':
    case 'ShiftRight':
      // Activate dash if not on cooldown
      if (!controls.dashCooldown) {
        dash();
      }
      break;
  }
}

function onKeyUp(event) {
  switch (event.code) {
    case 'KeyW':
      controls.moveForward = false;
      break;
    case 'KeyA':
      controls.moveLeft = false;
      break;
    case 'KeyS':
      controls.moveBackward = false;
      break;
    case 'KeyD':
      controls.moveRight = false;
      break;
  }
}

// New dash function
function dash() {
  if (controls.isDashing || controls.dashCooldown) return;
  
  controls.isDashing = true;
  controls.dashCooldown = true;
  
  // Create a dash effect (optional)
  const dashEffect = new THREE.Mesh(
    new THREE.RingGeometry(0.5, 0.7, 32),
    new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    })
  );
  dashEffect.position.copy(yawObject.position);
  dashEffect.lookAt(camera.getWorldDirection(new THREE.Vector3()).add(yawObject.position));
  scene.add(dashEffect);
  
  // Remove dash effect after dash duration
  setTimeout(() => {
    scene.remove(dashEffect);
  }, dashDuration);
  
  // End dash after duration
  setTimeout(() => {
    controls.isDashing = false;
  }, dashDuration);
  
  // Reset cooldown
  setTimeout(() => {
    controls.dashCooldown = false;
  }, dashCooldownTime);
}

function updatePlayer() {
  // Get movement direction
  direction.z = Number(controls.moveForward) - Number(controls.moveBackward);
  direction.x = Number(controls.moveLeft) - Number(controls.moveRight);
  direction.normalize();
  
  // Get current speed based on dash state
  const currentSpeed = controls.isDashing ? dashSpeed : moveSpeed;
  
  // Adjust direction relative to camera rotation
  const rotatedDirection = direction.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), yawObject.rotation.y);
  
  // Clear previous forces
  playerBody.force.set(0, playerBody.force.y, 0);
  
  // Apply force to physics body for movement
  if (controls.moveForward || controls.moveBackward) {
    playerBody.force.z += rotatedDirection.z * currentSpeed;
  }
  if (controls.moveLeft || controls.moveRight) {
    playerBody.force.x += rotatedDirection.x * currentSpeed;
  }
  
  // Update camera position from physics
  yawObject.position.x = playerBody.position.x;
  yawObject.position.y = playerBody.position.y;
  yawObject.position.z = playerBody.position.z;
  
  // Update player collider position
  playerCollider.position.copy(yawObject.position);
}

function updatePhysicsObjects() {
  // Update visual objects from physics bodies
  for (let i = 0; i < physicsObjects.length; i++) {
    const obj = physicsObjects[i];
    const body = physicsBodies[i];
    
    obj.position.x = body.position.x;
    obj.position.y = body.position.y;
    obj.position.z = body.position.z;
    
    obj.quaternion.x = body.quaternion.x;
    obj.quaternion.y = body.quaternion.y;
    obj.quaternion.z = body.quaternion.z;
    obj.quaternion.w = body.quaternion.w;
  }
}

function animate() {
  requestAnimationFrame(animate);
  
  // Step physics simulation
  world.step(1/60);
  
  // Update player movement
  updatePlayer();
  
  // Update physics objects
  updatePhysicsObjects();
  
  // Check for portal interactions
  checkPortals();
  
  // Render scene
  renderer.render(scene, camera);
}

function updatePlayer() {
    // Get the quaternion representing the camera's y-rotation (heading)
    const quaternion = new THREE.Quaternion();
    quaternion.setFromEuler(new THREE.Euler(0, yawObject.rotation.y, 0));
    
    // Reset movement direction
    direction.set(0, 0, 0);
    
    // Set direction based on keys pressed
    if (controls.moveForward) direction.z = -1;
    if (controls.moveBackward) direction.z = 1;
    if (controls.moveLeft) direction.x = -1;
    if (controls.moveRight) direction.x = 1;
    
    // Normalize direction vector for consistent speed in all directions
    if (direction.length() > 0) {
      direction.normalize();
    }
    
    // Apply camera rotation to direction
    direction.applyQuaternion(quaternion);
    
    // Get current speed based on dash state
    const currentSpeed = controls.isDashing ? dashSpeed : moveSpeed;
    
    // Clear previous forces but maintain y (gravity)
    playerBody.force.x = 0;
    playerBody.force.z = 0;
    
    // Apply force in the resulting direction
    playerBody.force.x += direction.x * currentSpeed;
    playerBody.force.z += direction.z * currentSpeed;
    
    // Update camera position from physics
    yawObject.position.x = playerBody.position.x;
    yawObject.position.y = playerBody.position.y;
    yawObject.position.z = playerBody.position.z;
    
    // Update player collider position
    playerCollider.position.copy(yawObject.position);
  }