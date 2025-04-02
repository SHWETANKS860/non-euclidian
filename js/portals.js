// portals.js - Handles portal creation and teleportation

export function initPortals(scene, world) {
    // Portal configs
    const portalConfigs = [
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
    
    // Active portals
    let portals = [];
    let physicsObjects = [];
    
    // Initialize with first configuration
    createPortals(portalConfigs[0]);
    
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
    
    function update(playerObjects) {
      checkPlayerPortals(playerObjects);
      checkObjectPortals();
    }
    
    function checkPlayerPortals(playerObjects) {
      // Check if player is near any portal
      portals.forEach(portal => {
        if (!portal.active) return;
        
        const distance = portal.mesh.position.distanceTo(playerObjects.yawObject.position);
        
        if (distance < portal.radius) {
          // Teleport player
          playerObjects.yawObject.position.copy(portal.destination);
          
          // Apply rotation offset
          if (portal.destinationRotation) {
            playerObjects.yawObject.rotation.y += portal.destinationRotation;
          }
          
          // Update physics body
          playerObjects.playerBody.position.x = playerObjects.yawObject.position.x;
          playerObjects.playerBody.position.y = playerObjects.yawObject.position.y;
          playerObjects.playerBody.position.z = playerObjects.yawObject.position.z;
          
          // Deactivate portal briefly
          portal.active = false;
          setTimeout(() => {
            portal.active = true;
          }, 1000);
        }
      });
    }
    
    function checkObjectPortals() {
      // Check if physics objects are near portals
      for (let i = 0; i < physicsObjects.length; i++) {
        const obj = physicsObjects[i];
        
        portals.forEach(portal => {
          if (!portal.active) return;
          
          const distance = portal.mesh.position.distanceTo(obj.mesh.position);
          
          if (distance < portal.radius) {
            // Teleport object
            obj.body.position.x = portal.destination.x;
            obj.body.position.y = portal.destination.y;
            obj.body.position.z = portal.destination.z;
            
            // Deactivate portal briefly for this object
            portal.active = false;
            setTimeout(() => {
              portal.active = true;
            }, 500);
          }
        });
      }
    }
    
    function addPhysicsObject(obj) {
      physicsObjects.push(obj);
      
      // Limit number of objects for performance
      if (physicsObjects.length > 30) {
        const oldObj = physicsObjects.shift();
        scene.remove(oldObj.mesh);
        world.remove(oldObj.body);
      }
    }
    
    function changeConfig(index) {
      createPortals(portalConfigs[index % portalConfigs.length]);
    }
    
    return {
      update,
      addPhysicsObject,
      changeConfig,
      configs: portalConfigs
    };
  }