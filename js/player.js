// player.js - Handles player creation and movement

export function initPlayer(scene, world, camera) {
    // Movement settings
    const moveSpeed = 15;
    const dashSpeed = 50;
    const dashDuration = 200;
    const dashCooldownTime = 1500;
    
    // Player controls state
    const controls = {
      moveForward: false,
      moveBackward: false,
      moveLeft: false,
      moveRight: false,
      canJump: false
    };
    
    // Create camera rig
    const pitchObject = new THREE.Object3D();
    pitchObject.add(camera);
    
    const yawObject = new THREE.Object3D();
    yawObject.position.y = 2;
    yawObject.add(pitchObject);
    scene.add(yawObject);
    
    // Create physics body
    const playerShape = new CANNON.Sphere(0.5);
    const playerBody = new CANNON.Body({
      mass: 5,
      position: new CANNON.Vec3(0, 3, 0),
      shape: playerShape,
      linearDamping: 0.7
    });
    
    playerBody.addEventListener('collide', function() {
      controls.canJump = true;
    });
    
    world.addBody(playerBody);
    
    // Visual representation (invisible but used for collision detection in scene)
    const playerCollider = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, visible: false })
    );
    scene.add(playerCollider);
    
    // Player update function
    function update(gameState) {
      updateMovement(gameState);
      updatePosition();
    }
    
    function updateMovement(gameState) {
      // Create quaternion from camera rotation
      const quaternion = new THREE.Quaternion();
      quaternion.setFromEuler(new THREE.Euler(0, yawObject.rotation.y, 0));
      
      // Calculate direction vector from controls
      const direction = new THREE.Vector3(0, 0, 0);
      
      if (controls.moveForward) direction.z = -1;
      if (controls.moveBackward) direction.z = 1;
      if (controls.moveLeft) direction.x = -1;
      if (controls.moveRight) direction.x = 1;
      
      // Normalize for consistent speed in diagonal movement
      if (direction.length() > 0) {
        direction.normalize();
      }
      
      // Apply camera rotation to direction
      direction.applyQuaternion(quaternion);
      
      // Get current speed based on dash state
      const currentSpeed = gameState.isDashing ? dashSpeed : moveSpeed;
      
      // Apply movement force
      playerBody.force.x = direction.x * currentSpeed;
      playerBody.force.z = direction.z * currentSpeed;
    }
    
    function updatePosition() {
      // Update camera position from physics
      yawObject.position.x = playerBody.position.x;
      yawObject.position.y = playerBody.position.y;
      yawObject.position.z = playerBody.position.z;
      
      // Update collider position
      playerCollider.position.copy(yawObject.position);
    }
    
    function dash(gameState) {
      if (gameState.isDashing || gameState.dashCooldown) return;
      
      gameState.isDashing = true;
      gameState.dashCooldown = true;
      
      // Create a dash effect
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
      
      // Remove effect after dash
      setTimeout(() => {
        scene.remove(dashEffect);
      }, dashDuration);
      
      // End dash after duration
      setTimeout(() => {
        gameState.isDashing = false;
      }, dashDuration);
      
      // Reset cooldown
      setTimeout(() => {
        gameState.dashCooldown = false;
      }, dashCooldownTime);
    }
    
    function jump() {
      if (controls.canJump) {
        playerBody.velocity.y = 7;
        controls.canJump = false;
      }
    }
    
    return {
      controls,
      playerBody,
      playerCollider,
      yawObject,
      pitchObject,
      update,
      dash,
      jump
    };
  }