// controls.js - Handles user input

export function initControls(controls, yawObject, pitchObject, playerBody, gameState) {
    // Add event listeners
    document.addEventListener('mousedown', function() {
      document.body.requestPointerLock();
    });
    
    document.addEventListener('mousemove', function(event) {
      onMouseMove(event, pitchObject, yawObject);
    });
    
    document.addEventListener('keydown', function(event) {
      onKeyDown(event, controls, playerBody, gameState);
    });
    
    document.addEventListener('keyup', function(event) {
      onKeyUp(event, controls);
    });
  }
  
  function onMouseMove(event, pitchObject, yawObject) {
    if (document.pointerLockElement === document.body) {
      const movementX = event.movementX || 0;
      const movementY = event.movementY || 0;
      
      yawObject.rotation.y -= movementX * 0.002;
      pitchObject.rotation.x -= movementY * 0.002;
      
      // Clamp vertical look
      pitchObject.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitchObject.rotation.x));
    }
  }
  
  function onKeyDown(event, controls, playerBody, gameState) {
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
          playerBody.velocity.y = 7;
          controls.canJump = false;
        }
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        // Trigger dash event
        if (!gameState.dashCooldown) {
          // This will be handled in player.js
          window.dispatchEvent(new CustomEvent('playerDash'));
        }
        break;
    }
  }
  
  function onKeyUp(event, controls) {
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