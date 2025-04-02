// main.js - Main application entry point

// Import dependencies
import { initScene } from './scene.js';
import { initPhysics } from './physics.js';
import { initPlayer } from './player.js';
import { initPortals } from './portals.js';
import { initControls } from './controls.js';
import { initUI } from './ui.js';

// Global variables
let renderer, scene, camera, world;
let gameState = {
  currentPortalConfig: 0,
  isDashing: false,
  dashCooldown: false
};

// Initialize the application
function init() {
  // Initialize scene, renderer and camera
  const sceneObjects = initScene();
  scene = sceneObjects.scene;
  camera = sceneObjects.camera;
  renderer = sceneObjects.renderer;
  
  // Initialize physics world
  world = initPhysics();
  
  // Initialize player
  const playerObjects = initPlayer(scene, world, camera);
  const playerControls = playerObjects.controls;
  
  // Initialize portals
  const portalSystem = initPortals(scene, world);
  
  // Initialize controls
  initControls(playerControls, playerObjects.yawObject, playerObjects.pitchObject, playerObjects.playerBody, gameState);
  
  // Initialize UI
  initUI(gameState, world, scene, playerObjects, portalSystem);
  
  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    
    // Update physics
    world.step(1/60);
    
    // Update player
    playerObjects.update(gameState);
    
    // Update portals
    portalSystem.update(playerObjects);
    
    // Render
    renderer.render(scene, camera);
  }
  
  // Start animation loop
  animate();
}

// Start application when DOM is loaded
window.addEventListener('DOMContentLoaded', init);

// Handle window resize
window.addEventListener('resize', function() {
  if (camera) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
  if (renderer) {
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
});