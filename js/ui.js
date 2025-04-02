// ui.js - Handles UI elements and interactions

export function initUI(gameState, world, scene, playerObjects, portalSystem) {
    // Event listeners for UI elements
    document.getElementById('toggleGravity').addEventListener('click', function() {
      toggleGravity(world);
    });
    
    document.getElementById('spawnCube').addEventListener('click', function() {
      spawnCube(scene, world, playerObjects.yawObject.position, portalSystem);
    });
    
    document.getElementById('changeWorld').addEventListener('click', function() {
      changePortalConfig(gameState, portalSystem);
    });
    
    // Listen for dash events
    window.addEventListener('playerDash', function() {
      playerObjects.dash(gameState);
    });
    
    // Update UI instructions
    document.querySelector('#info p').innerHTML = 'Move: WASD | Jump: Space | Dash: Shift | Look: Mouse';
  }
  
  function toggleGravity(world) {
    world.gravity.y = world.gravity.y === -9.82 ? 9.82 : -9.82;
  }
  
  function spawnCube(scene, world, position, portalSystem) {
    // Import from physics.js
    const cube = window.createPhysicsObject(world, scene, {
      x: position.x + (Math.random() * 2 - 1),
      y: position.y + 1,
      z: position.z + (Math.random() * 2 - 1)
    });
    
    // Add to portal system for teleportation
    portalSystem.addPhysicsObject(cube);
  }
  
  function changePortalConfig(gameState, portalSystem) {
    gameState.currentPortalConfig = (gameState.currentPortalConfig + 1) % portalSystem.configs.length;
    portalSystem.changeConfig(gameState.currentPortalConfig);
  }