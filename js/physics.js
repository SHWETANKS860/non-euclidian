// physics.js - Handles physics setup and interaction

export function initPhysics() {
    // Create physics world
    const world = new CANNON.World();
    world.gravity.set(0, -9.82, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;
    
    // Add ground
    addGround(world);
    
    // Add walls
    addWalls(world);
    
    return world;
  }
  
  function addGround(world) {
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({
      mass: 0,
      shape: groundShape
    });
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.addBody(groundBody);
  }
  
  function addWalls(world) {
    // Wall dimensions match visual walls in scene.js
    const walls = [
      { pos: new CANNON.Vec3(-15, 2.5, 0), rot: 0 },
      { pos: new CANNON.Vec3(15, 2.5, 0), rot: 0 },
      { pos: new CANNON.Vec3(0, 2.5, -15), rot: Math.PI/2 },
      { pos: new CANNON.Vec3(0, 2.5, 15), rot: Math.PI/2 }
    ];
    
    walls.forEach(wallConfig => {
      const wallShape = new CANNON.Box(new CANNON.Vec3(0.5, 2.5, 10));
      const wallBody = new CANNON.Body({
        mass: 0,
        shape: wallShape,
        position: wallConfig.pos
      });
      
      if (wallConfig.rot !== 0) {
        wallBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), wallConfig.rot);
      }
      
      world.addBody(wallBody);
    });
  }
  
  export function createPhysicsObject(world, scene, position, size = null) {
    // Random size if not specified
    size = size || 0.5 + Math.random() * 0.5;
    
    // Create physics body
    const cubeShape = new CANNON.Box(new CANNON.Vec3(size/2, size/2, size/2));
    const cubeBody = new CANNON.Body({
      mass: 1,
      shape: cubeShape,
      position: new CANNON.Vec3(position.x, position.y, position.z),
      linearDamping: 0.1,
      angularDamping: 0.1
    });
    
    world.addBody(cubeBody);
    
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
    
    return { body: cubeBody, mesh: cube };
  }