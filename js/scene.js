// scene.js - Handles scene setup and rendering

export function initScene() {
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    scene.fog = new THREE.Fog(0x000011, 0, 50);
    
    // Setup camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);
    
    // Add lights
    addLights(scene);
    
    // Add environment
    createEnvironment(scene);
    
    return { scene, camera, renderer };
  }
  
  function addLights(scene) {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
  }
  
  function createEnvironment(scene) {
    // Ground
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
    
    // Grid helper
    const grid = new THREE.GridHelper(100, 100, 0xffffff, 0x555555);
    scene.add(grid);
    
    // Create boundary walls
    createWalls(scene);
  }
  
  function createWalls(scene) {
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
      const wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.copy(wallConfig.pos);
      wall.rotation.copy(wallConfig.rot);
      wall.castShadow = true;
      wall.receiveShadow = true;
      scene.add(wall);
    });
    
    return walls;
  }