import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Camera,
  Eye,
  Maximize2,
  Video,
  Layers,
  ShieldAlert,
  Heart,
  Home,
  Building,
  AlertOctagon,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';

const DRONE_COLORS = [
  '#EF4444', // Red (UAV-Alpha)
  '#10B981', // Green (UAV-Beta)
  '#3B82F6', // Blue (UAV-Gamma)
  '#00F0FF', // Cyan (UAV-Delta)
  '#F59E0B', // Amber (UAV-Epsilon)
  '#8B5CF6', // Purple (UAV-Zeta)
  '#EC4899', // Pink
  '#14B8A6'  // Teal
];

// Room focal targets with close-up inspection camera positions per building complexity
const ROOM_TARGETS_MAP = {
  LOW: {
    OVERVIEW: {
      name: 'Overview',
      icon: '📐',
      target: new THREE.Vector3(0, 5, 0),
      cam: new THREE.Vector3(0, 52, 64)
    },
    LIVING_ROOM: {
      name: '1F Living',
      icon: '🛋️',
      target: new THREE.Vector3(-20, 2.5, -14),
      cam: new THREE.Vector3(-16, 12, -2)
    },
    KITCHEN: {
      name: '1F Kitchen',
      icon: '🍳',
      target: new THREE.Vector3(18, 2.5, -14),
      cam: new THREE.Vector3(14, 12, -2)
    },
    GARAGE: {
      name: '1F Garage',
      icon: '🚗',
      target: new THREE.Vector3(-20, 2.5, 14),
      cam: new THREE.Vector3(-16, 12, 24)
    },
    STAIRS_FOYER: {
      name: '1F Stairs',
      icon: '🚪',
      target: new THREE.Vector3(-2, 5, 6),
      cam: new THREE.Vector3(-2, 14, 18)
    },
    MASTER_BEDROOM: {
      name: '2F Bed',
      icon: '🛏️',
      target: new THREE.Vector3(22, 13.5, -18),
      cam: new THREE.Vector3(18, 20, -8)
    },
    SECOND_STUDY: {
      name: '2F Study',
      icon: '🧸',
      target: new THREE.Vector3(14, 13.5, -6),
      cam: new THREE.Vector3(10, 20, 4)
    }
  },
  MEDIUM: {
    OVERVIEW: {
      name: 'Overview',
      icon: '📐',
      target: new THREE.Vector3(0, 10, 0),
      cam: new THREE.Vector3(0, 68, 80)
    },
    TRIAGE_BAY: {
      name: '1F Triage',
      icon: '🩹',
      target: new THREE.Vector3(-20, 3, -14),
      cam: new THREE.Vector3(-16, 12, -2)
    },
    PHARMACY: {
      name: '1F Pharmacy',
      icon: '💊',
      target: new THREE.Vector3(18, 3, -14),
      cam: new THREE.Vector3(14, 12, -2)
    },
    RECEPTION: {
      name: '1F Lobby',
      icon: '🏥',
      target: new THREE.Vector3(0, 3, 16),
      cam: new THREE.Vector3(0, 14, 26)
    },
    PATIENT_WARD: {
      name: '2F Ward',
      icon: '🛏️',
      target: new THREE.Vector3(-18, 14, -10),
      cam: new THREE.Vector3(-14, 22, 2)
    },
    ICU_TRAUMA: {
      name: '2F ICU',
      icon: '🚨',
      target: new THREE.Vector3(18, 14, -10),
      cam: new THREE.Vector3(14, 22, 2)
    },
    DOCTORS_STN: {
      name: '2F Doctors',
      icon: '📋',
      target: new THREE.Vector3(0, 14, 14),
      cam: new THREE.Vector3(0, 22, 24)
    },
    PATHOLOGY_LAB: {
      name: '3F Lab',
      icon: '🔬',
      target: new THREE.Vector3(-16, 24, -8),
      cam: new THREE.Vector3(-12, 32, 4)
    },
    ROOF_DECK: {
      name: '3F Roof',
      icon: '🔭',
      target: new THREE.Vector3(16, 24, 6),
      cam: new THREE.Vector3(12, 32, 18)
    }
  },
  HIGH: {
    OVERVIEW: {
      name: 'Overview',
      icon: '📐',
      target: new THREE.Vector3(0, 20, 0),
      cam: new THREE.Vector3(0, 95, 110)
    },
    BASEMENT_POWER: {
      name: '1F Power',
      icon: '⚡',
      target: new THREE.Vector3(-18, 2, -12),
      cam: new THREE.Vector3(-14, 10, 2)
    },
    SUB_STORAGE: {
      name: '1F Storage',
      icon: '📦',
      target: new THREE.Vector3(18, 2, -12),
      cam: new THREE.Vector3(14, 10, 2)
    },
    GRAND_ATRIUM: {
      name: '2F Atrium',
      icon: '🏛️',
      target: new THREE.Vector3(0, 13, 0),
      cam: new THREE.Vector3(0, 24, 18)
    },
    SECURITY_DESK: {
      name: '2F Lobby',
      icon: '🛡️',
      target: new THREE.Vector3(18, 13, 14),
      cam: new THREE.Vector3(14, 22, 24)
    },
    SURGICAL_ICU: {
      name: '3F ICU',
      icon: '🩺',
      target: new THREE.Vector3(-16, 23, -10),
      cam: new THREE.Vector3(-12, 32, 2)
    },
    MEDICAL_WARD: {
      name: '3F Ward',
      icon: '🛏️',
      target: new THREE.Vector3(16, 23, -10),
      cam: new THREE.Vector3(12, 32, 2)
    },
    SERVER_VAULT: {
      name: '4F Server',
      icon: '💾',
      target: new THREE.Vector3(-16, 33, -8),
      cam: new THREE.Vector3(-12, 42, 4)
    },
    OFFICE_SUITE: {
      name: '4F Office',
      icon: '💼',
      target: new THREE.Vector3(16, 33, -8),
      cam: new THREE.Vector3(12, 42, 4)
    },
    HELIPAD_DECK: {
      name: '5F Helipad',
      icon: '🚁',
      target: new THREE.Vector3(0, 43, 0),
      cam: new THREE.Vector3(0, 54, 20)
    }
  }
};

const STOREYS_MAP = {
  LOW: [
    { id: 'ALL', label: 'All Floors', icon: '🏢' },
    { id: '1', label: 'Ground Floor (1F)', icon: '1️⃣' },
    { id: '2', label: 'Upper Floor (2F)', icon: '2️⃣' }
  ],
  MEDIUM: [
    { id: 'ALL', label: 'All Floors', icon: '🏢' },
    { id: '1', label: '1F Triage & Lobby', icon: '1️⃣' },
    { id: '2', label: '2F Clinic & Ward', icon: '2️⃣' },
    { id: '3', label: '3F Lab & Roof Deck', icon: '3️⃣' }
  ],
  HIGH: [
    { id: 'ALL', label: 'All Floors', icon: '🏢' },
    { id: '1', label: '1F Basement & Power', icon: '1️⃣' },
    { id: '2', label: '2F Grand Atrium', icon: '2️⃣' },
    { id: '3', label: '3F Surgical ICU', icon: '3️⃣' },
    { id: '4', label: '4F Server Offices', icon: '4️⃣' },
    { id: '5', label: '5F Helipad Deck', icon: '5️⃣' }
  ]
};

const BUILDING_META = {
  LOW: {
    title: '3D DISASTER 2-STOREY RESIDENTIAL HOUSE',
    numFloors: 2,
    overviewCam: new THREE.Vector3(0, 52, 64),
    overviewTarget: new THREE.Vector3(0, 5, 0)
  },
  MEDIUM: {
    title: '3D DISASTER 3-STOREY COMMERCIAL ANNEX',
    numFloors: 3,
    overviewCam: new THREE.Vector3(0, 68, 80),
    overviewTarget: new THREE.Vector3(0, 10, 0)
  },
  HIGH: {
    title: '3D DISASTER 5-STOREY DISASTER COMPLEX',
    numFloors: 5,
    overviewCam: new THREE.Vector3(0, 95, 110),
    overviewTarget: new THREE.Vector3(0, 20, 0)
  }
};

// Floor base elevation formula: Floor 1 is at 0, Floor 2 at 11.2, etc.
const getFloorBaseY = (floor) => {
  const f = Math.max(1, Math.min(5, Number(floor) || 1));
  return (f - 1) * 11.2;
};

// Fallback initial drone fleet if simulation service has not connected yet
const DEFAULT_INITIAL_DRONES = [
  {
    drone_id: 'UAV-Alpha',
    x: 170,
    y: 130,
    z: 8,
    floor: 1,
    current_role: 'Search and exploration',
    battery: 98,
    trajectory: [{ x: 130, y: 100 }, { x: 170, y: 130 }]
  },
  {
    drone_id: 'UAV-Beta',
    x: 380,
    y: 130,
    z: 8,
    floor: 1,
    current_role: 'Search and exploration',
    battery: 97,
    trajectory: [{ x: 340, y: 110 }, { x: 380, y: 130 }]
  },
  {
    drone_id: 'UAV-Gamma',
    x: 590,
    y: 130,
    z: 8,
    floor: 1,
    current_role: 'Search and exploration',
    battery: 96,
    trajectory: [{ x: 550, y: 110 }, { x: 590, y: 130 }]
  },
  {
    drone_id: 'UAV-Delta',
    x: 400,
    y: 310,
    z: 18,
    floor: 2,
    current_role: 'Search and exploration',
    battery: 95,
    trajectory: [{ x: 360, y: 280 }, { x: 400, y: 310 }]
  },
  {
    drone_id: 'UAV-Epsilon',
    x: 600,
    y: 310,
    z: 18,
    floor: 2,
    current_role: 'Search and exploration',
    battery: 94,
    trajectory: [{ x: 560, y: 280 }, { x: 600, y: 310 }]
  },
  {
    drone_id: 'UAV-Zeta',
    x: 390,
    y: 480,
    z: 18,
    floor: 2,
    current_role: 'Communication relay',
    battery: 99,
    role_adapted: true,
    trajectory: [{ x: 390, y: 450 }, { x: 390, y: 480 }]
  }
];

export const ThreeBuildingSimulation = ({
  simState,
  selectedDroneId = 'UAV-Alpha',
  onSelectDrone,
  showFpvPip = true,
  showTrajectories = true,
  showBeams = true,
  buildingComplexity
}) => {
  const mountRef = useRef(null);
  const [activeFpvDrone, setActiveFpvDrone] = useState(selectedDroneId);
  const [cameraPreset, setCameraPreset] = useState('OVERVIEW');
  const [floorView, setFloorView] = useState('ALL'); // 'ALL' or floor number '1', '2', etc.
  const [dragMode, setDragMode] = useState('PAN'); // 'PAN' (Drag to scroll) vs 'ORBIT' (Rotate)
  const [isFpvExpanded, setIsFpvExpanded] = useState(false);
  const [showTaskMatrix, setShowTaskMatrix] = useState(true);
  const [openDropdown, setOpenDropdown] = useState(null); // 'STOREYS' | 'ROOMS' | 'FPV' | null
  const toolbarRef = useRef(null);

  // Active complexity resolution
  const activeComplexity = (
    buildingComplexity ||
    simState?.environment?.complexity ||
    'MEDIUM'
  ).toUpperCase();

  const activeRoomTargets = ROOM_TARGETS_MAP[activeComplexity] || ROOM_TARGETS_MAP.MEDIUM;
  const activeStoreys = STOREYS_MAP[activeComplexity] || STOREYS_MAP.MEDIUM;
  const activeMeta = BUILDING_META[activeComplexity] || BUILDING_META.MEDIUM;

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Three.js mutable state refs
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const mainCameraRef = useRef(null);
  const fpvCameraRef = useRef(null);
  const controlsRef = useRef(null);
  const droneMeshesRef = useRef({});
  const trajectoryLinesRef = useRef({});
  const victimObjectsRef = useRef({});
  const dustParticlesRef = useRef(null);
  const animFrameRef = useRef(null);
  const stairwellShaftRef = useRef(null);
  const timeRef = useRef(0);
  const targetLerpRef = useRef({ active: false, target: new THREE.Vector3(), camPos: new THREE.Vector3() });

  // Building root group and modular floor groups
  const buildingRootGroupRef = useRef(new THREE.Group());
  const floorGroupsRef = useRef({});
  const materialsRef = useRef(null);

  // Sync selected drone with active FPV drone
  useEffect(() => {
    if (selectedDroneId) {
      setActiveFpvDrone(selectedDroneId);
    }
  }, [selectedDroneId]);

  // Update mouse button mapping whenever dragMode (PAN vs ORBIT) changes
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    if (dragMode === 'PAN') {
      controls.mouseButtons = {
        LEFT: THREE.MOUSE.PAN,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE
      };
      controls.touches = {
        ONE: THREE.TOUCH.PAN,
        TWO: THREE.TOUCH.DOLLY_PAN
      };
    } else {
      controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
      };
      controls.touches = {
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN
      };
    }
  }, [dragMode]);

  // Dynamic Floor Visibility Filtering
  useEffect(() => {
    const groups = floorGroupsRef.current;
    if (!groups) return;
    const numFloors = activeMeta.numFloors;

    for (let f = 1; f <= numFloors; f++) {
      if (groups[f]) {
        if (floorView === 'ALL') {
          groups[f].visible = true;
        } else {
          const targetFloor = parseInt(floorView, 10);
          groups[f].visible = (f <= targetFloor);
        }
      }
    }

    if (groups.roof) {
      groups.roof.visible = (floorView === 'ALL' || parseInt(floorView, 10) === numFloors);
    }
  }, [floorView, activeComplexity, activeMeta.numFloors]);

  // Programmatic pan function: moves camera and target along screen-space right and up vectors
  const panCamera = useCallback((deltaX, deltaY) => {
    const camera = mainCameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    targetLerpRef.current.active = false;
    setCameraPreset('CUSTOM');

    const right = new THREE.Vector3();
    const up = new THREE.Vector3();
    camera.matrixWorld.extractBasis(right, up, new THREE.Vector3());

    const moveOffset = new THREE.Vector3()
      .addScaledVector(right, deltaX)
      .addScaledVector(up, deltaY);

    controls.target.add(moveOffset);
    camera.position.add(moveOffset);
    controls.update();
  }, []);

  // Programmatic zoom function: zooms towards or away from current focal target
  const zoomCamera = useCallback((factor) => {
    const camera = mainCameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    targetLerpRef.current.active = false;

    const direction = new THREE.Vector3().subVectors(controls.target, camera.position);
    const dist = direction.length();
    const newDist = Math.max(controls.minDistance, Math.min(controls.maxDistance, dist * factor));
    direction.setLength(dist - newDist);
    camera.position.add(direction);
    controls.update();
  }, []);

  // Smooth focus transition to a designated room or target point
  const focusRoom = useCallback((roomKey) => {
    const targets = ROOM_TARGETS_MAP[activeComplexity] || ROOM_TARGETS_MAP.MEDIUM;
    const room = targets[roomKey];
    if (!room) return;
    setCameraPreset(roomKey);
    targetLerpRef.current = {
      active: true,
      target: room.target.clone(),
      camPos: room.cam.clone()
    };
  }, [activeComplexity]);

  // Keyboard navigation listener (Arrow keys, WASD, QE, +/-, Space/Home)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

      const panStep = 3.2;
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        panCamera(-panStep, 0);
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        panCamera(panStep, 0);
      } else if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') {
        panCamera(0, panStep);
      } else if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') {
        panCamera(0, -panStep);
      } else if (e.key.toLowerCase() === 'q') {
        panCamera(0, -panStep * 0.7);
      } else if (e.key.toLowerCase() === 'e') {
        panCamera(0, panStep * 0.7);
      } else if (e.key === '+' || e.key === '=') {
        zoomCamera(0.85);
      } else if (e.key === '-' || e.key === '_') {
        zoomCamera(1.15);
      } else if (e.key === ' ' || e.key === 'Home') {
        focusRoom('OVERVIEW');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [panCamera, zoomCamera, focusRoom]);

  // Double-click to instantly pan & zoom directly to any clicked point in any room
  const handleCanvasDoubleClick = (e) => {
    const container = mountRef.current;
    const camera = mainCameraRef.current;
    const scene = sceneRef.current;
    const controls = controlsRef.current;
    if (!container || !camera || !scene || !controls) return;

    const rect = container.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    const hit = intersects.find((i) => i.point && i.object && i.object.type === 'Mesh' && !i.object.isPoints);
    if (hit) {
      const targetPoint = hit.point.clone();
      const currentDir = camera.position.clone().sub(controls.target).normalize();
      const zoomDist = 20.0;
      const newCamPos = targetPoint.clone().add(currentDir.multiplyScalar(zoomDist));

      setCameraPreset('CUSTOM');
      targetLerpRef.current = {
        active: true,
        target: targetPoint,
        camPos: newCamPos
      };
    }
  };

  // =========================================================================
  // 1. INITIALIZE THREE.JS SCENE, LIGHTS & CONTROLS (ON MOUNT)
  // =========================================================================
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 580;

    // 1. Scene & Atmospheric Overcast Sky
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#7A99BA');
    scene.fog = new THREE.FogExp2('#7A99BA', 0.0055);

    // 2. Main Perspective Camera
    const mainCamera = new THREE.PerspectiveCamera(46, width / height, 0.5, 450);
    mainCameraRef.current = mainCamera;
    mainCamera.position.copy(activeMeta.overviewCam);
    mainCamera.lookAt(activeMeta.overviewTarget);

    // 3. FPV Camera for Drone Nose (Picture-in-Picture)
    const fpvCamera = new THREE.PerspectiveCamera(75, 220 / 140, 0.2, 200);
    fpvCameraRef.current = fpvCamera;

    // 4. WebGL Renderer with Shadows & Antialiasing
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.autoClear = false;
    renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      console.warn('[ThreeBuildingSimulation] WebGL context lost prevented.');
    });
    container.appendChild(renderer.domElement);

    // 5. Orbit Controls with Full Screen-Space Panning
    const controls = new OrbitControls(mainCamera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = true;
    controls.screenSpacePanning = true;
    controls.panSpeed = 1.4;
    controls.minDistance = 4;
    controls.maxDistance = 280;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.target.copy(activeMeta.overviewTarget);

    controls.mouseButtons = {
      LEFT: THREE.MOUSE.PAN,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.ROTATE
    };

    controls.addEventListener('start', () => {
      targetLerpRef.current.active = false;
    });

    // 6. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaee, 1.35);
    sunLight.position.set(55, 95, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 300;
    sunLight.shadow.camera.left = -65;
    sunLight.shadow.camera.right = 65;
    sunLight.shadow.camera.top = 65;
    sunLight.shadow.camera.bottom = -65;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x8cb0d0, 0.55);
    fillLight.position.set(-50, 45, -50);
    scene.add(fillLight);

    // Textures & Procedural Materials
    const brickTex = createProceduralBrickTexture();
    brickTex.wrapS = THREE.RepeatWrapping;
    brickTex.wrapT = THREE.RepeatWrapping;
    brickTex.repeat.set(5, 1.4);

    const floorTex = createProceduralTileTexture();
    floorTex.wrapS = THREE.RepeatWrapping;
    floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(16, 12);

    const woodTex = createProceduralWoodTexture();
    woodTex.wrapS = THREE.RepeatWrapping;
    woodTex.wrapT = THREE.RepeatWrapping;
    woodTex.repeat.set(8, 8);

    materialsRef.current = {
      brickTex,
      floorTex,
      woodTex,
      wallMat: new THREE.MeshStandardMaterial({ map: brickTex, roughness: 0.85, metalness: 0.05 }),
      floorMat: new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.70, metalness: 0.12 }),
      woodFloorMat: new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.65 }),
      woodBeamMat: new THREE.MeshStandardMaterial({ color: 0x8B5A2B, roughness: 0.75 }),
      drywallMat: new THREE.MeshStandardMaterial({ color: 0xD1D5DB, roughness: 0.9 }),
      fabricMat: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 }),
      concreteMat: new THREE.MeshStandardMaterial({ color: 0x64748B, roughness: 0.85 }),
      metalMat: new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 }),
      hospitalFloorMat: new THREE.MeshStandardMaterial({ color: 0xCBD5E1, roughness: 0.45, metalness: 0.1 }),
      medicalWhiteMat: new THREE.MeshStandardMaterial({ color: 0xF8FAFC, roughness: 0.4 }),
      serverMat: new THREE.MeshStandardMaterial({ color: 0x0F172A, roughness: 0.3, metalness: 0.7 }),
      generatorMat: new THREE.MeshStandardMaterial({ color: 0xD97706, roughness: 0.5, metalness: 0.4 })
    };

    // Attach building root group
    scene.add(buildingRootGroupRef.current);

    // Dust particles
    const dustCount = 200;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 85;
      dustPos[i * 3 + 1] = Math.random() * 55;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 65;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xE2E8F0,
      size: 0.32,
      transparent: true,
      opacity: 0.50
    });
    const dustPoints = new THREE.Points(dustGeo, dustMat);
    scene.add(dustPoints);
    dustParticlesRef.current = dustPoints;

    // =========================================================================
    // RENDER LOOP
    // =========================================================================
    let isRunning = true;

    const animate = () => {
      if (!isRunning) return;
      timeRef.current += 0.016;
      const t = timeRef.current;

      controls.update();

      // Smooth camera focus glide
      if (targetLerpRef.current.active) {
        controls.target.lerp(targetLerpRef.current.target, 0.08);
        mainCamera.position.lerp(targetLerpRef.current.camPos, 0.08);
        if (
          controls.target.distanceTo(targetLerpRef.current.target) < 0.15 &&
          mainCamera.position.distanceTo(targetLerpRef.current.camPos) < 0.15
        ) {
          targetLerpRef.current.active = false;
        }
      }

      // Animate atmospheric dust
      if (dustParticlesRef.current) {
        const positions = dustParticlesRef.current.geometry.attributes.position.array;
        for (let i = 0; i < dustCount; i++) {
          positions[i * 3 + 1] += Math.sin(t + i) * 0.012 - 0.006;
          if (positions[i * 3 + 1] < 0) positions[i * 3 + 1] = 55;
        }
        dustParticlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // Animate victims & Emergency Beacon Kits
      const victimDict = victimObjectsRef.current;
      Object.keys(victimDict).forEach((vId) => {
        const vItem = victimDict[vId];
        if (vItem) {
          const pulse = 1.0 + Math.sin(t * 3.5 + Number(vId.replace(/\D/g, ''))) * 0.16;
          if (vItem.heatRing) vItem.heatRing.scale.set(pulse, pulse, pulse);

          // Animate Emergency First-Aid Radio Beacon Kit
          if (vItem.beaconKit) {
            const led = vItem.beaconKit.getObjectByName('beaconLed');
            const ping = vItem.beaconKit.getObjectByName('beaconPing');
            if (led && led.material) {
              const strobe = Math.sin(t * 8.0) > 0 ? 1.0 : 0.25;
              led.material.opacity = strobe;
            }
            if (ping && ping.material) {
              const pingScale = 1.0 + ((t * 1.8) % 2.0);
              ping.scale.set(pingScale, pingScale, 1.0);
              ping.material.opacity = Math.max(0, 0.7 - (pingScale - 1.0) * 0.45);
            }
          }
        }
      });

      // Animate Vertical Stairwell RF Waveguide Shaft
      if (stairwellShaftRef.current && stairwellShaftRef.current.userData) {
        const pulseRing = stairwellShaftRef.current.userData.pulseRing;
        const totalHeight = stairwellShaftRef.current.userData.totalHeight || 25;
        if (pulseRing && pulseRing.material) {
          const progress = (t * 0.45) % 1.0;
          pulseRing.position.y = progress * totalHeight;
          pulseRing.material.opacity = 0.85 * (1.0 - Math.abs(progress - 0.5) * 1.8);
        }
      }

      // Animate drone quadcopters
      const droneMeshes = droneMeshesRef.current;
      Object.keys(droneMeshes).forEach((id) => {
        const droneGroup = droneMeshes[id];
        if (droneGroup && droneGroup.userData) {
          const rotors = droneGroup.userData.rotors || [];
          rotors.forEach((rotor, rIdx) => {
            rotor.rotation.y += 0.44 * (rIdx % 2 === 0 ? 1 : -1);
          });
          droneGroup.position.y += Math.sin(t * 4 + droneGroup.userData.index) * 0.012;

          const halo = droneGroup.userData.halo;
          if (halo) {
            const haloPulse = 1.0 + Math.sin(t * 3 + droneGroup.userData.index) * 0.08;
            halo.scale.set(haloPulse, haloPulse, haloPulse);
          }
        }
      });

      // Update FPV Camera (Tactical Chase View to see Drone Movement clearly)
      const activeMesh = droneMeshes[activeFpvDrone];
      if (activeMesh) {
        const chaseDist = 3.6;
        const chaseHeight = 1.8;
        const offset = new THREE.Vector3(0, chaseHeight, chaseDist);
        offset.applyEuler(activeMesh.rotation);

        fpvCamera.position.copy(activeMesh.position).add(offset);
        fpvCamera.lookAt(
          activeMesh.position.x,
          activeMesh.position.y + 0.35,
          activeMesh.position.z
        );
      }

      const curW = container.clientWidth || width;
      const curH = container.clientHeight || height;

      if (curW > 0 && curH > 0) {
        // PASS 1: Main Viewport
        renderer.setViewport(0, 0, curW, curH);
        renderer.setScissor(0, 0, curW, curH);
        renderer.setScissorTest(false);
        renderer.clear();
        renderer.render(scene, mainCamera);

        // PASS 2: FPV PiP
        if (showFpvPip && activeMesh && fpvCamera) {
          const pipW = Math.round(isFpvExpanded ? Math.min(curW * 0.55, 420) : Math.min(curW * 0.32, 230));
          const pipH = Math.round(pipW * (140 / 220));
          const pipX = curW - pipW - 14;
          const pipY = 14;

          if (pipW > 20 && pipH > 20 && pipX >= 0) {
            try {
              renderer.setScissorTest(true);
              renderer.setScissor(pipX, pipY, pipW, pipH);
              renderer.setViewport(pipX, pipY, pipW, pipH);

              // Set bright white background for FPV PiP so drone movement is crystal clear
              const prevBg = scene.background;
              const prevFog = scene.fog;
              scene.background = new THREE.Color(0xffffff);
              scene.fog = null;

              fpvCamera.aspect = pipW / pipH;
              fpvCamera.updateProjectionMatrix();
              renderer.clearDepth();
              renderer.render(scene, fpvCamera);

              // Restore scene background and fog for main pass
              scene.background = prevBg;
              scene.fog = prevFog;
            } catch (fpvErr) {
              console.warn('PiP render warning:', fpvErr);
            } finally {
              renderer.setScissorTest(false);
            }
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      mainCamera.aspect = newW / newH;
      mainCamera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      isRunning = false;
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // =========================================================================
  // 2. DYNAMIC ARCHITECTURAL BUILDING SWITCHING (LOW, MEDIUM, HIGH)
  // =========================================================================
  useEffect(() => {
    const root = buildingRootGroupRef.current;
    const mats = materialsRef.current;
    if (!root || !mats) return;

    // Clear previous building meshes
    while (root.children.length > 0) {
      const child = root.children[0];
      root.remove(child);
    }
    floorGroupsRef.current = {};

    // Reconstruct architecture based on selected building complexity
    if (activeComplexity === 'LOW') {
      build2FloorHouse(root, mats, floorGroupsRef);
    } else if (activeComplexity === 'HIGH') {
      build5FloorComplex(root, mats, floorGroupsRef);
    } else {
      build3FloorClinic(root, mats, floorGroupsRef);
    }

    // Build Central Vertical Stairwell RF Waveguide Shaft (Line-of-Sight propagation anchor)
    buildStairwellWaveguide(root, activeMeta.numFloors, stairwellShaftRef);

    // Reset floor view to ALL
    setFloorView('ALL');

    // Smoothly re-frame camera to overview for new building
    const meta = BUILDING_META[activeComplexity] || BUILDING_META.MEDIUM;
    setCameraPreset('OVERVIEW');
    targetLerpRef.current = {
      active: true,
      target: meta.overviewTarget.clone(),
      camPos: meta.overviewCam.clone()
    };
  }, [activeComplexity]);

  // =========================================================================
  // 3. DYNAMIC VICTIM SYNCHRONIZATION ACROSS FLOORS
  // =========================================================================
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const victims = simState?.environment?.victims || [
      { id: 'victim_1', name: 'Trapped Resident in Living Room', x: 170, y: 130, z: 8, floor: 1, vital_temp_c: 37.1, pulse_bpm: 84, detected: false },
      { id: 'victim_2', name: 'Resident behind Kitchen Cabinets', x: 380, y: 130, z: 8, floor: 1, vital_temp_c: 37.0, pulse_bpm: 79, detected: false },
      { id: 'victim_3', name: 'Resident in Garage Rubble', x: 590, y: 130, z: 8, floor: 1, vital_temp_c: 36.8, pulse_bpm: 86, detected: false },
      { id: 'victim_4', name: 'Resident in 2F Master Bed Rubble', x: 400, y: 310, z: 18, floor: 2, vital_temp_c: 37.4, pulse_bpm: 94, detected: false }
    ];

    const victimDict = victimObjectsRef.current;
    const victimTextureLoader = new THREE.TextureLoader();
    const humanVictimTex = victimTextureLoader.load('/human_victim_1.jpg');

    // Clean up victims when building changes or victim count shrinks
    const activeVictimIdSet = new Set(victims.map((v, i) => v.id || `victim_${i + 1}`));
    Object.keys(victimDict).forEach((id) => {
      if (!activeVictimIdSet.has(id)) {
        scene.remove(victimDict[id].group);
        delete victimDict[id];
      }
    });

    victims.forEach((v, vIdx) => {
      const vId = v.id || `victim_${vIdx + 1}`;
      const isDetected = Boolean(v.detected);
      const floorLevel = Math.max(1, Math.min(5, v.floor || 1));
      const baseFloorY = getFloorBaseY(floorLevel);

      const worldX = ((v.x - 400) / 400) * 33;
      const worldZ = ((v.y - 300) / 300) * 23;
      const worldY = baseFloorY + 1.2;

      let vItem = victimDict[vId];

      if (!vItem) {
        const group = new THREE.Group();
        group.position.set(worldX, worldY, worldZ);

        const spriteMat = new THREE.SpriteMaterial({
          map: humanVictimTex,
          color: 0xffffff,
          transparent: true
        });
        const humanSprite = new THREE.Sprite(spriteMat);
        humanSprite.scale.set(5.5, 5.5, 1.0);
        humanSprite.position.set(0, 1.4, 0);
        group.add(humanSprite);

        const heatGeo = new THREE.RingGeometry(1.6, 4.4, 32);
        const heatMat = new THREE.MeshBasicMaterial({
          color: isDetected ? 0x10B981 : 0xEF4444,
          transparent: true,
          opacity: 0.55,
          side: THREE.DoubleSide
        });
        const heatRing = new THREE.Mesh(heatGeo, heatMat);
        heatRing.rotation.x = -Math.PI / 2;
        heatRing.position.y = -1.1;
        group.add(heatRing);

        const triageColor = v.triage_tag === 'RED' ? 0xEF4444 : v.triage_tag === 'YELLOW' ? 0xF59E0B : 0x10B981;
        const initialColor = isDetected ? triageColor : 0xEF4444;

        const coreGeo = new THREE.SphereGeometry(0.75, 16, 16);
        const coreMat = new THREE.MeshBasicMaterial({
          color: initialColor
        });
        const coreSphere = new THREE.Mesh(coreGeo, coreMat);
        coreSphere.position.set(0, 0.4, 0);
        group.add(coreSphere);

        const hudBadge = createTriageBadgeMesh(v, isDetected);
        hudBadge.position.set(0, 4.6, 0);
        group.add(hudBadge);

        // Emergency First-Aid Radio Beacon Kit
        let beaconKit = null;
        if (v.payload_status === 'DELIVERED') {
          beaconKit = createBeaconKitMesh();
          beaconKit.position.set(1.4, -0.4, 0.6);
          group.add(beaconKit);
        }

        scene.add(group);

        vItem = {
          group,
          humanSprite,
          heatRing,
          coreSphere,
          hudBadge,
          beaconKit,
          isDetected,
          detectedBy: v.detected_by,
          triageTag: v.triage_tag,
          payloadStatus: v.payload_status,
          data: v
        };
        victimDict[vId] = vItem;
      } else {
        // Update position in case victim's floor or coordinates updated
        vItem.group.position.set(worldX, worldY, worldZ);

        const stateChanged = (
          vItem.isDetected !== isDetected ||
          vItem.detectedBy !== v.detected_by ||
          vItem.triageTag !== v.triage_tag ||
          vItem.payloadStatus !== v.payload_status
        );

        if (stateChanged) {
          vItem.isDetected = isDetected;
          vItem.detectedBy = v.detected_by;
          vItem.triageTag = v.triage_tag;
          vItem.payloadStatus = v.payload_status;

          const targetColor = v.triage_tag === 'RED' ? 0xEF4444 : v.triage_tag === 'YELLOW' ? 0xF59E0B : 0x10B981;
          vItem.heatRing.material.color.setHex(targetColor);
          vItem.coreSphere.material.color.setHex(targetColor);

          vItem.group.remove(vItem.hudBadge);
          vItem.hudBadge.material.map.dispose();
          vItem.hudBadge.geometry.dispose();

          const newBadge = createTriageBadgeMesh(v, isDetected);
          newBadge.position.set(0, 4.6, 0);
          vItem.group.add(newBadge);
          vItem.hudBadge = newBadge;

          // Sync Emergency First-Aid Radio Beacon Kit mesh
          if (v.payload_status === 'DELIVERED' && !vItem.beaconKit) {
            const kit = createBeaconKitMesh();
            kit.position.set(1.4, -0.4, 0.6);
            vItem.group.add(kit);
            vItem.beaconKit = kit;
          } else if (v.payload_status !== 'DELIVERED' && vItem.beaconKit) {
            vItem.group.remove(vItem.beaconKit);
            vItem.beaconKit = null;
          }
        }
      }
    });
  }, [simState, activeComplexity]);

  // =========================================================================
  // 4. DYNAMIC DRONE POSITIONS & TRAJECTORIES ACROSS ALL FLOORS
  // =========================================================================
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const drones = (simState?.drones && simState.drones.length > 0)
      ? simState.drones
      : DEFAULT_INITIAL_DRONES;

    const droneMeshes = droneMeshesRef.current;
    const trajLines = trajectoryLinesRef.current;

    // Clean up meshes for drones removed when fleet size changes
    const activeDroneIdSet = new Set(drones.map(d => d.drone_id));
    Object.keys(droneMeshes).forEach(id => {
      if (!activeDroneIdSet.has(id)) {
        scene.remove(droneMeshes[id]);
        delete droneMeshes[id];
      }
    });
    Object.keys(trajLines).forEach(id => {
      if (!activeDroneIdSet.has(id)) {
        scene.remove(trajLines[id]);
        delete trajLines[id];
      }
    });

    drones.forEach((drone, idx) => {
      const droneId = drone.drone_id;
      const colorHex = DRONE_COLORS[idx % DRONE_COLORS.length];
      const floorLevel = Math.max(1, Math.min(5, drone.floor || 1));
      const baseAlt = getFloorBaseY(floorLevel) + 4.8;

      const worldX = ((drone.x - 400) / 400) * 33;
      const worldZ = ((drone.y - 300) / 300) * 23;
      const worldY = baseAlt + (drone.z ? (drone.z / 36) * 2.0 : 0);

      if (!droneMeshes[droneId]) {
        const droneGroup = createQuadcopterMesh(colorHex, idx, droneId, drone.current_role);
        droneGroup.position.set(worldX, worldY, worldZ);
        droneGroup.userData = { id: droneId, index: idx, color: colorHex };
        scene.add(droneGroup);
        droneMeshes[droneId] = droneGroup;
      } else {
        const group = droneMeshes[droneId];
        const targetPos = new THREE.Vector3(worldX, worldY, worldZ);

        const moveDelta = targetPos.clone().sub(group.position);
        if (moveDelta.length() > 0.05) {
          const targetRot = Math.atan2(-moveDelta.z, moveDelta.x);
          group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, targetRot, 0.16);
          const bankAngle = Math.min(0.28, moveDelta.length() * 0.16);
          group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, -bankAngle, 0.14);
        }

        group.position.lerp(targetPos, 0.18);
      }

      // Update Distinct Color Trajectory Trails
      const traj = drone.trajectory || [];
      if (showTrajectories && traj.length > 1) {
        const points = traj.map((pt) => {
          const px = ((pt.x - 400) / 400) * 33;
          const pz = ((pt.y - 300) / 300) * 23;
          const ptFloor = Math.max(1, Math.min(5, pt.floor || (pt.z && pt.z >= 10.0 ? 2 : 1)));
          const pFloorY = getFloorBaseY(ptFloor) + 4.2;
          return new THREE.Vector3(px, pFloorY, pz);
        });

        points.push(new THREE.Vector3(worldX, worldY - 0.4, worldZ));

        if (!trajLines[droneId]) {
          const curve = new THREE.CatmullRomCurve3(points);
          const curvePoints = curve.getPoints(Math.max(30, points.length * 4));
          const lineGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
          const lineMat = new THREE.LineBasicMaterial({
            color: new THREE.Color(colorHex),
            linewidth: 4,
            transparent: true,
            opacity: 0.95
          });
          const line = new THREE.Line(lineGeo, lineMat);
          scene.add(line);
          trajLines[droneId] = line;
        } else {
          const line = trajLines[droneId];
          const curve = new THREE.CatmullRomCurve3(points);
          const curvePoints = curve.getPoints(Math.max(30, points.length * 4));
          line.geometry.dispose();
          line.geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
        }
      }
    });
  }, [simState, showTrajectories, activeComplexity]);

  const activeDroneObj = (simState?.drones || DEFAULT_INITIAL_DRONES).find((d) => d.drone_id === activeFpvDrone);
  const activeRole = activeDroneObj?.current_role || 'Search and exploration';
  const isRelay = activeRole.toLowerCase().includes('relay');

  const recentRoleChangeEvent = (simState?.recent_events || []).find(
    (e) => e.eventType === 'ROLE_CHANGED' || e.eventType === 'TASK_REASSIGNED'
  );

  const totalVictimsCount =
    simState?.total_victims ||
    simState?.environment?.victims?.length ||
    (activeComplexity === 'HIGH' ? 10 : activeComplexity === 'LOW' ? 6 : 7);

  const rawVictims = simState?.environment?.victims || [];
  const detectedVictimsCount = simState?.victims_detected || 0;
  const rescuePercent = Math.min(100, Math.round((detectedVictimsCount / (totalVictimsCount || 1)) * 100));
  const deliveredPayloadsCount = rawVictims.filter((v) => v.payload_status === 'DELIVERED').length;

  return (
    <div className="relative border border-cyan-500/40 rounded-2xl overflow-hidden bg-[#0A101D] shadow-[0_0_35px_rgba(6,182,212,0.2)] flex flex-col">
      {/* Top 3D Arena Command Header & Dynamic HUD Dropdowns */}
      <div ref={toolbarRef} className="w-full bg-[#080E1C]/95 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between text-[11px] font-mono select-none gap-2 z-10">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold text-white tracking-wider flex items-center">
              {activeComplexity === 'HIGH' ? (
                <Building className="w-3.5 h-3.5 mr-1 text-purple-400" />
              ) : activeComplexity === 'MEDIUM' ? (
                <Activity className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              ) : (
                <Home className="w-3.5 h-3.5 mr-1 text-cyan-400" />
              )}
              {activeMeta.title}
            </span>
          </div>

          <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 px-3 py-1 rounded-xl text-[10px] font-mono text-slate-200 flex flex-wrap items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-white">
              VICTIMS: {detectedVictimsCount} / {totalVictimsCount}
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-emerald-400 font-bold">
              {rescuePercent}% LOCATED
            </span>
            {deliveredPayloadsCount > 0 && (
              <>
                <span className="text-slate-500">|</span>
                <span className="text-amber-400 font-bold flex items-center space-x-1">
                  <span>📦</span>
                  <span>{deliveredPayloadsCount} BEACONS DROPPED</span>
                </span>
              </>
            )}
            <span className="text-slate-500">|</span>
            <span className="text-cyan-400 font-bold flex items-center space-x-1" title="Central Stairwell Line-of-Sight RF Waveguide Active">
              <span>📶</span>
              <span>STAIRWELL LOS ACTIVE</span>
            </span>
          </div>
        </div>

        {/* HUD Controls Group: Storeys, Zoom Room, FPV, Task Matrix */}
        <div className="flex flex-wrap items-center gap-2">
          {/* STOREYS HUD Dropdown */}
          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'STOREYS' ? null : 'STOREYS')}
              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border flex items-center space-x-1.5 transition cursor-pointer ${
                openDropdown === 'STOREYS' || floorView !== 'ALL'
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
              title="Filter building storeys / floors"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>STOREYS: {activeStoreys.find((s) => s.id === floorView)?.label || 'All Floors'}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === 'STOREYS' ? 'rotate-180 text-cyan-400' : 'text-slate-500'}`} />
            </button>
            {openDropdown === 'STOREYS' && (
              <div className="absolute top-full mt-1.5 left-0 min-w-[160px] bg-slate-950/95 backdrop-blur-xl border border-cyan-500/40 rounded-xl p-1.5 shadow-2xl z-30 space-y-1">
                {activeStoreys.map((s) => {
                  const isSelected = floorView === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        setFloorView(s.id);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center space-x-2 transition cursor-pointer ${
                        isSelected ? 'bg-cyan-500 text-slate-950 font-extrabold' : 'text-slate-300 hover:bg-slate-850 hover:text-white'
                      }`}
                    >
                      <span>{s.icon}</span>
                      <span>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ZOOM ROOM HUD Dropdown */}
          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'ROOMS' ? null : 'ROOMS')}
              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border flex items-center space-x-1.5 transition cursor-pointer ${
                openDropdown === 'ROOMS' || cameraPreset !== 'OVERVIEW'
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
              title="Focus and zoom camera directly to room"
            >
              <Home className="w-3.5 h-3.5 text-cyan-400" />
              <span>ZOOM ROOM: {activeRoomTargets[cameraPreset]?.name || 'Overview'}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === 'ROOMS' ? 'rotate-180 text-cyan-400' : 'text-slate-500'}`} />
            </button>
            {openDropdown === 'ROOMS' && (
              <div className="absolute top-full mt-1.5 left-0 min-w-[175px] bg-slate-950/95 backdrop-blur-xl border border-cyan-500/40 rounded-xl p-1.5 shadow-2xl z-30 space-y-1">
                {Object.keys(activeRoomTargets).map((key) => {
                  const rm = activeRoomTargets[key];
                  const isSelected = cameraPreset === key;
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        focusRoom(key);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center space-x-2 transition cursor-pointer ${
                        isSelected ? 'bg-cyan-500 text-slate-950 font-extrabold' : 'text-slate-300 hover:bg-slate-850 hover:text-white'
                      }`}
                    >
                      <span className="text-sm">{rm.icon}</span>
                      <span>{rm.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* FPV HUD Dropdown */}
          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'FPV' ? null : 'FPV')}
              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border flex items-center space-x-1.5 transition cursor-pointer ${
                openDropdown === 'FPV'
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
              title="Switch active onboard FPV camera drone"
            >
              <Video className="w-3.5 h-3.5 text-cyan-400" />
              <span>FPV: {activeFpvDrone}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === 'FPV' ? 'rotate-180 text-cyan-400' : 'text-slate-500'}`} />
            </button>
            {openDropdown === 'FPV' && (
              <div className="absolute top-full mt-1.5 right-0 min-w-[150px] bg-slate-950/95 backdrop-blur-xl border border-cyan-500/40 rounded-xl p-1.5 shadow-2xl z-30 space-y-1">
                {(simState?.drones || DEFAULT_INITIAL_DRONES).map((d, idx) => {
                  const isSelected = activeFpvDrone === d.drone_id;
                  const color = DRONE_COLORS[idx % DRONE_COLORS.length];
                  return (
                    <button
                      key={d.drone_id}
                      onClick={() => {
                        setActiveFpvDrone(d.drone_id);
                        if (onSelectDrone) onSelectDrone(d.drone_id);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-between transition cursor-pointer ${
                        isSelected ? 'bg-cyan-500 text-slate-950 font-extrabold' : 'text-slate-300 hover:bg-slate-850 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                        <span>{d.drone_id}</span>
                      </span>
                      <span className="text-[9px] opacity-75">{d.current_role || 'Search'}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* TASK MATRIX HUD Toggle */}
          <button
            onClick={() => setShowTaskMatrix(!showTaskMatrix)}
            className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border flex items-center space-x-1.5 transition cursor-pointer ${
              showTaskMatrix ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.25)]' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title="Toggle Tactical UAV Role & Search Task Matrix HUD"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>{showTaskMatrix ? 'Hide HUD' : 'Show HUD'}</span>
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={mountRef}
        onDoubleClick={handleCanvasDoubleClick}
        style={{ width: '100%', height: '580px' }}
        className={`relative block ${
          dragMode === 'PAN' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
        }`}
      >
        {/* On-Screen FPV Inset Video Frame Badge (Picture-in-Picture) */}
        {showFpvPip && (
          <div
            className={`absolute bottom-3 right-3 rounded-xl border-2 border-white shadow-[0_0_25px_rgba(255,255,255,0.45)] overflow-hidden pointer-events-auto transition-all duration-200 z-20 ${
              isFpvExpanded ? 'w-[360px] h-[230px]' : 'w-[230px] h-[146px]'
            }`}
            style={{ backgroundColor: 'transparent' }}
          >
            {/* White-Themed Header Bar */}
            <div className="bg-white/95 border-b border-slate-200 px-2.5 py-1.5 flex items-center justify-between text-[10px] font-mono text-slate-900 shadow-sm">
              <span className="flex items-center space-x-1.5 font-bold">
                <Video className="w-3.5 h-3.5 text-red-600 animate-pulse" />
                <span className="font-extrabold tracking-wide text-slate-900">{activeFpvDrone} ONBOARD FPV</span>
              </span>
              <button
                onClick={() => setIsFpvExpanded(!isFpvExpanded)}
                className="text-slate-600 hover:text-slate-950 transition p-0.5 cursor-pointer"
                title="Expand FPV View"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
            </div>

            {/* High-Contrast Crosshair */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-7 h-7 border border-cyan-600/70 rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-cyan-600 rounded-full" />
              </div>
            </div>

            {/* White-Themed High-Contrast Telemetry Bar */}
            <div className="absolute bottom-1 left-2 right-2 flex items-center justify-between text-[9px] font-mono text-slate-900 font-bold drop-shadow-sm pointer-events-none bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded border border-slate-200">
              <span className="text-slate-700">CHASE CAM • 30 FPS</span>
              <span className={isRelay ? 'text-purple-700 font-extrabold' : 'text-emerald-700 font-extrabold'}>
                {isRelay ? '⚡ RELAY (0.10%/s)' : 'SEARCH (0.35%/s)'}
              </span>
            </div>
          </div>
        )}

        {/* TOP CENTER: ROLE ADAPTATION BANNER */}
        {recentRoleChangeEvent && (
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 bg-purple-950/90 border border-purple-500/60 text-purple-200 px-4 py-1.5 rounded-xl text-xs font-mono backdrop-blur-md shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center space-x-2 z-20 pointer-events-none animate-bounce">
            <Zap className="w-4 h-4 text-purple-400 animate-pulse" />
            <span className="font-bold text-white">AUTONOMOUS ADAPTATION:</span>
            <span>
              {recentRoleChangeEvent.droneId} role changed from{' '}
              <span className="text-amber-400 font-bold">{recentRoleChangeEvent.previousRole || 'SEARCH'}</span> ➔{' '}
              <span className="text-purple-400 font-bold">{recentRoleChangeEvent.newRole || 'COMM RELAY'}</span>{' '}
              (Drain: 0.10%/s)
            </span>
          </div>
        )}

        {/* TOP-RIGHT: UAV TACTICAL ROSTER & ROLE SWITCH MATRIX HUD */}
        {showTaskMatrix && (
          <div className="absolute top-3 right-3 w-80 bg-slate-950/90 backdrop-blur-md border border-cyan-500/30 rounded-xl p-2.5 text-[10px] font-mono shadow-2xl z-20 pointer-events-auto">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-cyan-400 font-bold">
              <span className="flex items-center">
                <Activity className="w-3.5 h-3.5 mr-1" />
                UAV ROLE & SEARCH TASK MATRIX
              </span>
              <span className="text-[9px] text-slate-400">{(simState?.drones || DEFAULT_INITIAL_DRONES).length} ACTIVE</span>
            </div>

            <div className="mt-2 space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {(simState?.drones || DEFAULT_INITIAL_DRONES).map((d, dIdx) => {
                const color = DRONE_COLORS[dIdx % DRONE_COLORS.length];
                const dRole = d.current_role || 'Search';
                const isRelayRole = dRole.toLowerCase().includes('relay');
                const isSwitchedRole = d.role_adapted || isRelayRole;
                const assignedTask = (simState?.tasks || []).find((t) => t.assignedDrone === d.drone_id);
                const floorLevel = Math.max(1, Math.min(5, d.floor || 1));

                return (
                  <div
                    key={d.drone_id}
                    onClick={() => {
                      onSelectDrone && onSelectDrone(d.drone_id);
                      const targetVec = new THREE.Vector3(
                        ((d.x - 400) / 400) * 33,
                        getFloorBaseY(floorLevel) + 4.8,
                        ((d.y - 300) / 300) * 23
                      );
                      const camVec = targetVec.clone().add(new THREE.Vector3(0, 10, 15));
                      targetLerpRef.current = {
                        active: true,
                        target: targetVec,
                        camPos: camVec
                      };
                      setCameraPreset('CUSTOM');
                    }}
                    className={`p-1.5 rounded-lg border transition cursor-pointer flex flex-col space-y-1 ${
                      d.drone_id === selectedDroneId
                        ? 'bg-cyan-950/50 border-cyan-500/70'
                        : isSwitchedRole
                        ? 'bg-purple-950/30 border-purple-500/40'
                        : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                    title="Click to zoom directly to this UAV"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                        <span className="font-bold text-white">{d.drone_id}</span>
                        <span className="text-[9px] text-slate-400">F{floorLevel}</span>
                      </div>

                      <span
                        className={`px-1.5 py-0.2 rounded font-bold text-[9px] ${
                          isRelayRole
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        }`}
                      >
                        {isRelayRole ? '⚡ RELAY (0.10%/s)' : '🔍 SEARCH (0.35%/s)'}
                      </span>
                    </div>

                    <div className="text-[9px] text-slate-300 flex items-center justify-between">
                      <span className="truncate max-w-[170px]">
                        {isRelayRole
                          ? '⚡ Eco Loiter (Mesh Anchor)'
                          : `🔍 ${assignedTask?.title || 'Sector Autonomous Patrol'}`}
                      </span>
                      <span
                        className={`font-bold ${
                          (d.battery || 100) < 30
                            ? 'text-red-400'
                            : (d.battery || 100) < 60
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        🔋 {Math.round(d.battery || 100)}%
                      </span>
                    </div>

                    {isSwitchedRole && (
                      <div className="text-[8.5px] bg-purple-950/80 border border-purple-500/40 text-purple-300 px-1 py-0.5 rounded flex items-center space-x-1">
                        <Zap className="w-2.5 h-2.5 text-purple-400" />
                        <span>ROLE ADAPTED: Battery preserved (-0.10%/s)</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status & Color Trajectory Legend */}
      <div className="w-full bg-[#080E1C]/95 border-t border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-400 select-none gap-2">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1.5 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Casualty Detected (Green)</span>
          </span>
          <span className="flex items-center space-x-1.5 text-red-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span>Unidentified Casualty (Red)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-1 bg-red-500 rounded" />
            <span className="text-slate-300">UAV-Alpha</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-1 bg-emerald-500 rounded" />
            <span className="text-slate-300">UAV-Beta</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-1 bg-blue-500 rounded" />
            <span className="text-slate-300">UAV-Gamma</span>
          </span>
        </div>
        <div className="flex items-center space-x-3 text-cyan-400 font-bold">
          <span>Controls: Left Drag to Pan • Wheel to Zoom • Double-Click to Focus</span>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// PROCEDURAL ARCHITECTURE BUILDERS: 2-FLOOR, 3-FLOOR, 5-FLOOR BUILDINGS
// =============================================================================

/**
 * 1. TWO-STOREY DISASTER RESIDENTIAL HOUSE (LOW COMPLEXITY)
 */
function build2FloorHouse(rootGroup, mats, floorGroupsRef) {
  const houseWidth = 76;
  const houseLength = 54;
  const groundWallH = 10.5;
  const secondFloorY = 11.2;
  const secondWallH = 9.5;

  const groundFloorGroup = new THREE.Group();
  const secondFloorGroup = new THREE.Group();
  const roofTrussGroup = new THREE.Group();

  floorGroupsRef.current[1] = groundFloorGroup;
  floorGroupsRef.current[2] = secondFloorGroup;
  floorGroupsRef.current.roof = roofTrussGroup;

  rootGroup.add(groundFloorGroup);
  rootGroup.add(secondFloorGroup);
  rootGroup.add(roofTrussGroup);

  // STOREY 1: GROUND FLOOR
  const groundFloorGeo = new THREE.PlaneGeometry(houseWidth, houseLength);
  const groundFloorMesh = new THREE.Mesh(groundFloorGeo, mats.floorMat);
  groundFloorMesh.rotation.x = -Math.PI / 2;
  groundFloorMesh.position.y = 0;
  groundFloorMesh.receiveShadow = true;
  groundFloorGroup.add(groundFloorMesh);

  // Front porch
  const porchMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
  const porchMesh = new THREE.Mesh(new THREE.BoxGeometry(16, 0.6, 7), porchMat);
  porchMesh.position.set(0, 0.3, houseLength / 2 + 3.5);
  porchMesh.receiveShadow = true;
  groundFloorGroup.add(porchMesh);

  // Cutaway perimeter walls (front wall low for camera line of sight)
  const wallThick = 1.8;
  createWallMesh(groundFloorGroup, mats.wallMat, houseWidth + wallThick, groundWallH, wallThick, 0, groundWallH / 2, -houseLength / 2);
  createWallMesh(groundFloorGroup, mats.wallMat, wallThick, groundWallH, houseLength, -houseWidth / 2, groundWallH / 2, 0);
  createWallMesh(groundFloorGroup, mats.wallMat, wallThick, groundWallH, houseLength, houseWidth / 2, groundWallH / 2, 0);
  createWallMesh(groundFloorGroup, mats.wallMat, houseWidth + wallThick, 1.0, wallThick, 0, 0.5, houseLength / 2);

  // Interior partition walls
  createWallMesh(groundFloorGroup, mats.wallMat, wallThick, 8.5, 18, -4, 4.25, -18);
  createWallMesh(groundFloorGroup, mats.wallMat, wallThick, 8.5, 18, -4, 4.25, 18);
  createWallMesh(groundFloorGroup, mats.wallMat, 30, 8.5, wallThick, -21, 4.25, 0);
  createWallMesh(groundFloorGroup, mats.wallMat, 30, 8.5, wallThick, 21, 4.25, 0);

  // 3D Room Banners
  create3DRoomBadge(groundFloorGroup, '🛋️ 1F: LIVING ROOM (COLLAPSED BEAM)', -20, 10.8, -14);
  create3DRoomBadge(groundFloorGroup, '🍳 1F: KITCHEN & DINING (BROKEN TILES)', 18, 10.8, -14);
  create3DRoomBadge(groundFloorGroup, '🚗 1F: GARAGE & WORKSHOP (FALLEN RAFTERS)', -20, 10.8, 14);
  create3DRoomBadge(groundFloorGroup, '🚪 1F: MAIN FOYER & STAIRWELL', 0, 10.8, 20);

  // Furniture & Rubble
  createDamagedSofa(groundFloorGroup, mats.fabricMat, -22, 0, -18, 0.25);
  createFallenBeam(groundFloorGroup, mats.woodBeamMat, -28, 8.5, -20, -14, 0.6, -12);
  createRubbleField(groundFloorGroup, mats.drywallMat, mats.wallMat, -20, -14, 22, 9.0);

  createKitchenCounter(groundFloorGroup, 26, -22);
  createTiltedDiningTable(groundFloorGroup, 14, -12);
  createRubbleField(groundFloorGroup, mats.drywallMat, mats.wallMat, 18, -14, 16, 7.5);

  createFallenBeam(groundFloorGroup, mats.woodBeamMat, -32, 6.5, 8, -12, 0.4, 20);
  createFallenBeam(groundFloorGroup, mats.woodBeamMat, -10, 5.5, 22, -26, 0.4, 10);
  createRubbleField(groundFloorGroup, mats.drywallMat, mats.wallMat, -20, 14, 24, 9.0);

  createCrackedPit(groundFloorGroup, 0, 0.05, 0, 4.8);

  // Physical 3D Staircase connecting floors
  createStaircase(groundFloorGroup, -2.5, 0, 12, 14, secondFloorY);

  // STOREY 2: SECOND FLOOR MEZZANINE
  const secondFloorWidth = 36;
  const secondFloorLength = 26;
  const secondFloorGeo = new THREE.BoxGeometry(secondFloorWidth, 0.7, secondFloorLength);
  const secondFloorMesh = new THREE.Mesh(secondFloorGeo, mats.woodFloorMat);
  secondFloorMesh.position.set(18, secondFloorY - 0.35, -13);
  secondFloorMesh.receiveShadow = true;
  secondFloorMesh.castShadow = true;
  secondFloorGroup.add(secondFloorMesh);

  createRailing(secondFloorGroup, 0, secondFloorY, -13, secondFloorLength, true);
  createRailing(secondFloorGroup, 18, secondFloorY, 0, secondFloorWidth, false);

  createWallMesh(secondFloorGroup, mats.wallMat, secondFloorWidth + wallThick, secondWallH, wallThick, 18, secondFloorY + secondWallH / 2, -houseLength / 2);
  createWallMesh(secondFloorGroup, mats.wallMat, wallThick, secondWallH, secondFloorLength, houseWidth / 2, secondFloorY + secondWallH / 2, -13);
  createWallMesh(secondFloorGroup, mats.wallMat, secondFloorWidth, secondWallH, wallThick, 18, secondFloorY + secondWallH / 2, -13);

  create3DRoomBadge(secondFloorGroup, '🛏️ 2F: MASTER BEDROOM (CRUSHED BED)', 22, secondFloorY + secondWallH + 0.8, -18);
  create3DRoomBadge(secondFloorGroup, '🧸 2F: 2ND BEDROOM & STUDY (RUBBLE)', 14, secondFloorY + secondWallH + 0.8, -6);

  createCollapsedBed(secondFloorGroup, mats.woodBeamMat, 24, secondFloorY, -20, 0.2);
  createTiltedWardrobe(secondFloorGroup, 33, secondFloorY, -18);
  createRubbleField(secondFloorGroup, mats.drywallMat, mats.wallMat, 22, -18, 16, 7.5, secondFloorY);

  createSingleBed(secondFloorGroup, 14, secondFloorY, -6);
  createOverturnedDesk(secondFloorGroup, 24, secondFloorY, -6);
  createRubbleField(secondFloorGroup, mats.drywallMat, mats.wallMat, 18, -6, 14, 6.5, secondFloorY);

  // ROOF LEVEL: TRUSSES
  const trussY = secondFloorY + secondWallH;
  [-24, -13, -2].forEach((tz) => {
    createRoofTruss(roofTrussGroup, mats.woodBeamMat, 18, trussY, tz, secondFloorWidth);
  });
  createFallenBeam(roofTrussGroup, mats.woodBeamMat, 0, trussY, -6, -18, 4.0, -10);
}

/**
 * 2. THREE-STOREY COMMERCIAL ANNEX & CLINIC (MEDIUM COMPLEXITY)
 */
function build3FloorClinic(rootGroup, mats, floorGroupsRef) {
  const bWidth = 80;
  const bLength = 56;
  const wallThick = 1.8;
  const floorH = 11.2;

  const floor1Group = new THREE.Group();
  const floor2Group = new THREE.Group();
  const floor3Group = new THREE.Group();
  const roofGroup = new THREE.Group();

  floorGroupsRef.current[1] = floor1Group;
  floorGroupsRef.current[2] = floor2Group;
  floorGroupsRef.current[3] = floor3Group;
  floorGroupsRef.current.roof = roofGroup;

  rootGroup.add(floor1Group);
  rootGroup.add(floor2Group);
  rootGroup.add(floor3Group);
  rootGroup.add(roofGroup);

  // ==================== STOREY 1: EMERGENCY TRIAGE & RECEPTION ====================
  const f1FloorMesh = new THREE.Mesh(new THREE.PlaneGeometry(bWidth, bLength), mats.hospitalFloorMat);
  f1FloorMesh.rotation.x = -Math.PI / 2;
  f1FloorMesh.receiveShadow = true;
  floor1Group.add(f1FloorMesh);

  // Perimeter walls (cutaway front wall)
  createWallMesh(floor1Group, mats.wallMat, bWidth + wallThick, 10.5, wallThick, 0, 5.25, -bLength / 2);
  createWallMesh(floor1Group, mats.wallMat, wallThick, 10.5, bLength, -bWidth / 2, 5.25, 0);
  createWallMesh(floor1Group, mats.wallMat, wallThick, 10.5, bLength, bWidth / 2, 5.25, 0);
  createWallMesh(floor1Group, mats.wallMat, bWidth + wallThick, 1.2, wallThick, 0, 0.6, bLength / 2);

  // Partitions
  createWallMesh(floor1Group, mats.wallMat, wallThick, 8.5, 24, -8, 4.25, -16);
  createWallMesh(floor1Group, mats.wallMat, wallThick, 8.5, 24, 8, 4.25, -16);
  createWallMesh(floor1Group, mats.wallMat, 32, 8.5, wallThick, -24, 4.25, 2);

  // Badges
  create3DRoomBadge(floor1Group, '🩹 1F: EMERGENCY TRIAGE BAY', -22, 10.8, -14);
  create3DRoomBadge(floor1Group, '💊 1F: PHARMACY & SUPPLIES', 20, 10.8, -14);
  create3DRoomBadge(floor1Group, '🏥 1F: RECEPTION & CLINIC LOBBY', 0, 10.8, 18);

  // Props
  createHospitalBed(floor1Group, -24, 0, -18, 0.2);
  createHospitalBed(floor1Group, -16, 0, -14, -0.15);
  createIVPole(floor1Group, -20, 0, -22);
  createMedicalMonitor(floor1Group, -12, 0, -16, -0.4);
  createRubbleField(floor1Group, mats.drywallMat, mats.wallMat, -20, -14, 20, 8.0);

  createMedicineCabinet(floor1Group, 30, 0, -22, false);
  createMedicineCabinet(floor1Group, 22, 0, -22, true);
  createKitchenCounter(floor1Group, 24, -10);
  createRubbleField(floor1Group, mats.drywallMat, mats.wallMat, 20, -14, 18, 7.5);

  createReceptionDesk(floor1Group, 0, 0, 12, 16);
  createCrackedPit(floor1Group, 0, 0.05, 4, 4.2);

  // Staircase 1: Floor 1 -> Floor 2
  createStaircase(floor1Group, -3.0, 0, 8, 14, floorH);

  // ==================== STOREY 2: PATIENT WARD & ICU ====================
  const f2Width = 72;
  const f2Length = 46;
  const f2FloorMesh = new THREE.Mesh(new THREE.BoxGeometry(f2Width, 0.7, f2Length), mats.hospitalFloorMat);
  f2FloorMesh.position.set(0, floorH - 0.35, -5);
  f2FloorMesh.receiveShadow = true;
  f2FloorMesh.castShadow = true;
  floor2Group.add(f2FloorMesh);

  // Railing along open mezzanine opening
  createRailing(floor2Group, 0, floorH, 18, f2Width, false);

  createWallMesh(floor2Group, mats.wallMat, f2Width + wallThick, 10.0, wallThick, 0, floorH + 5.0, -bLength / 2);
  createWallMesh(floor2Group, mats.wallMat, wallThick, 10.0, f2Length, -f2Width / 2, floorH + 5.0, -5);
  createWallMesh(floor2Group, mats.wallMat, wallThick, 10.0, f2Length, f2Width / 2, floorH + 5.0, -5);

  // Partition
  createWallMesh(floor2Group, mats.wallMat, wallThick, 8.5, 26, 0, floorH + 4.25, -15);

  create3DRoomBadge(floor2Group, '🛏️ 2F: INPATIENT WARD (COLLAPSE)', -18, floorH + 10.8, -12);
  create3DRoomBadge(floor2Group, '🚨 2F: ICU TRAUMA BAY', 18, floorH + 10.8, -12);
  create3DRoomBadge(floor2Group, '📋 2F: DOCTORS CONSULTATION', 0, floorH + 10.8, 12);

  createHospitalBed(floor2Group, -24, floorH, -18, 0.1);
  createHospitalBed(floor2Group, -14, floorH, -18, -0.1);
  createHospitalBed(floor2Group, -20, floorH, -8, 0.3);
  createIVPole(floor2Group, -18, floorH, -22);
  createRubbleField(floor2Group, mats.drywallMat, mats.wallMat, -18, -12, 18, 8.0, floorH);

  createHospitalBed(floor2Group, 18, floorH, -18, -0.2);
  createMedicalMonitor(floor2Group, 26, floorH, -18, 0.3);
  createMedicalMonitor(floor2Group, 12, floorH, -18, -0.4);
  createRubbleField(floor2Group, mats.drywallMat, mats.wallMat, 18, -12, 16, 7.5, floorH);

  // Staircase 2: Floor 2 -> Floor 3
  createStaircase(floor2Group, -3.0, floorH, 6, 14, floorH * 2);

  // ==================== STOREY 3: DIAGNOSTICS & ROOF DECK ====================
  const f3Width = 52;
  const f3Length = 36;
  const f3FloorMesh = new THREE.Mesh(new THREE.BoxGeometry(f3Width, 0.7, f3Length), mats.woodFloorMat);
  f3FloorMesh.position.set(0, floorH * 2 - 0.35, -10);
  f3FloorMesh.receiveShadow = true;
  f3FloorMesh.castShadow = true;
  floor3Group.add(f3FloorMesh);

  createRailing(floor3Group, 0, floorH * 2, 8, f3Width, false);
  createRailing(floor3Group, -f3Width / 2, floorH * 2, -10, f3Length, true);

  createWallMesh(floor3Group, mats.wallMat, f3Width + wallThick, 9.5, wallThick, 0, floorH * 2 + 4.75, -bLength / 2);
  createWallMesh(floor3Group, mats.wallMat, wallThick, 9.5, f3Length, f3Width / 2, floorH * 2 + 4.75, -10);

  create3DRoomBadge(floor3Group, '🔬 3F: PATHOLOGY & DIAGNOSTICS LAB', -12, floorH * 2 + 10.5, -14);
  create3DRoomBadge(floor3Group, '🔭 3F: OBSERVATION ROOF DECK', 14, floorH * 2 + 10.5, 4);

  createLabBench(floor3Group, -14, floorH * 2, -18, 14);
  createLabBench(floor3Group, -14, floorH * 2, -8, 12);
  createRubbleField(floor3Group, mats.drywallMat, mats.wallMat, -12, -14, 16, 6.5, floorH * 2);

  // ROOF LEVEL
  const trussY = floorH * 2 + 9.5;
  [-22, -10].forEach((tz) => {
    createRoofTruss(roofGroup, mats.metalMat, 0, trussY, tz, f3Width);
  });
  createHVACUnit(roofGroup, 16, floorH * 2, -18);
}

/**
 * 3. FIVE-STOREY METROPOLITAN DISASTER COMPLEX (HIGH COMPLEXITY)
 */
function build5FloorComplex(rootGroup, mats, floorGroupsRef) {
  const bWidth = 84;
  const bLength = 58;
  const wallThick = 2.0;
  const floorH = 11.2;

  const f1Group = new THREE.Group();
  const f2Group = new THREE.Group();
  const f3Group = new THREE.Group();
  const f4Group = new THREE.Group();
  const f5Group = new THREE.Group();
  const roofGroup = new THREE.Group();

  floorGroupsRef.current[1] = f1Group;
  floorGroupsRef.current[2] = f2Group;
  floorGroupsRef.current[3] = f3Group;
  floorGroupsRef.current[4] = f4Group;
  floorGroupsRef.current[5] = f5Group;
  floorGroupsRef.current.roof = roofGroup;

  rootGroup.add(f1Group);
  rootGroup.add(f2Group);
  rootGroup.add(f3Group);
  rootGroup.add(f4Group);
  rootGroup.add(f5Group);
  rootGroup.add(roofGroup);

  // ==================== STOREY 1: BASEMENT FOUNDATION & POWER GENERATOR ====================
  const f1FloorMesh = new THREE.Mesh(new THREE.PlaneGeometry(bWidth, bLength), mats.concreteMat);
  f1FloorMesh.rotation.x = -Math.PI / 2;
  f1FloorMesh.receiveShadow = true;
  f1Group.add(f1FloorMesh);

  createWallMesh(f1Group, mats.wallMat, bWidth + wallThick, 10.5, wallThick, 0, 5.25, -bLength / 2);
  createWallMesh(f1Group, mats.wallMat, wallThick, 10.5, bLength, -bWidth / 2, 5.25, 0);
  createWallMesh(f1Group, mats.wallMat, wallThick, 10.5, bLength, bWidth / 2, 5.25, 0);
  createWallMesh(f1Group, mats.wallMat, bWidth + wallThick, 1.2, wallThick, 0, 0.6, bLength / 2);

  // Heavy structural concrete support pillars
  [-22, 22].forEach((px) => {
    [-14, 14].forEach((pz) => {
      createConcretePillar(f1Group, mats.concreteMat, px, 0, pz, 3.0, 10.5);
    });
  });

  create3DRoomBadge(f1Group, '⚡ 1F: EMERGENCY GENERATOR & POWER', -20, 10.8, -14);
  create3DRoomBadge(f1Group, '📦 1F: SUB-LEVEL STORAGE & CELLAR', 20, 10.8, -14);

  createGeneratorUnit(f1Group, -24, 0, -18);
  createRubbleField(f1Group, mats.concreteMat, mats.wallMat, -20, -14, 25, 8.5);
  createMedicineCabinet(f1Group, 24, 0, -22, true);
  createRubbleField(f1Group, mats.concreteMat, mats.wallMat, 20, -14, 22, 8.0);
  createCrackedPit(f1Group, 0, 0.05, 0, 5.2);

  createStaircase(f1Group, -3.0, 0, 10, 14, floorH);

  // ==================== STOREY 2: GROUND GRAND ATRIUM & LOBBY ====================
  const f2FloorMesh = new THREE.Mesh(new THREE.BoxGeometry(bWidth - 4, 0.7, bLength - 4), mats.floorMat);
  f2FloorMesh.position.set(0, floorH - 0.35, 0);
  f2FloorMesh.receiveShadow = true;
  f2Group.add(f2FloorMesh);

  createWallMesh(f2Group, mats.wallMat, bWidth + wallThick, 10.5, wallThick, 0, floorH + 5.25, -bLength / 2);
  createWallMesh(f2Group, mats.wallMat, wallThick, 10.5, bLength, -bWidth / 2, floorH + 5.25, 0);
  createWallMesh(f2Group, mats.wallMat, wallThick, 10.5, bLength, bWidth / 2, floorH + 5.25, 0);
  createWallMesh(f2Group, mats.wallMat, bWidth + wallThick, 1.2, wallThick, 0, floorH + 0.6, bLength / 2);

  create3DRoomBadge(f2Group, '🏛️ 2F: GRAND CENTRAL ATRIUM', 0, floorH + 10.8, -4);
  create3DRoomBadge(f2Group, '🛡️ 2F: SECURITY & RECEPTION LOBBY', 22, floorH + 10.8, 16);

  createReceptionDesk(f2Group, 22, floorH, 12, 16);
  createDamagedSofa(f2Group, mats.fabricMat, -20, floorH, 10, 0.4);
  createRubbleField(f2Group, mats.drywallMat, mats.wallMat, 0, -4, 20, 8.0, floorH);

  createStaircase(f2Group, -3.0, floorH, 10, 14, floorH * 2);

  // ==================== STOREY 3: SURGICAL ICU & MEDICAL WING ====================
  const f3Width = 74;
  const f3Length = 48;
  const f3FloorMesh = new THREE.Mesh(new THREE.BoxGeometry(f3Width, 0.7, f3Length), mats.hospitalFloorMat);
  f3FloorMesh.position.set(0, floorH * 2 - 0.35, -4);
  f3FloorMesh.receiveShadow = true;
  f3Group.add(f3FloorMesh);

  createRailing(f3Group, 0, floorH * 2, 20, f3Width, false);

  createWallMesh(f3Group, mats.wallMat, f3Width + wallThick, 10.0, wallThick, 0, floorH * 2 + 5.0, -bLength / 2);
  createWallMesh(f3Group, mats.wallMat, wallThick, 10.0, f3Length, -f3Width / 2, floorH * 2 + 5.0, -4);
  createWallMesh(f3Group, mats.wallMat, wallThick, 10.0, f3Length, f3Width / 2, floorH * 2 + 5.0, -4);

  create3DRoomBadge(f3Group, '🩺 3F: SURGICAL ICU & TRAUMA', -18, floorH * 2 + 10.5, -12);
  create3DRoomBadge(f3Group, '🛏️ 3F: INPATIENT MEDICAL WARD', 18, floorH * 2 + 10.5, -12);

  createHospitalBed(f3Group, -22, floorH * 2, -18, 0.2);
  createMedicalMonitor(f3Group, -14, floorH * 2, -18, -0.3);
  createHospitalBed(f3Group, 18, floorH * 2, -18, -0.15);
  createIVPole(f3Group, 24, floorH * 2, -18);
  createRubbleField(f3Group, mats.drywallMat, mats.wallMat, 0, -12, 18, 7.5, floorH * 2);

  createStaircase(f3Group, -3.0, floorH * 2, 10, 14, floorH * 3);

  // ==================== STOREY 4: SERVER VAULTS & CORPORATE OFFICES ====================
  const f4Width = 64;
  const f4Length = 40;
  const f4FloorMesh = new THREE.Mesh(new THREE.BoxGeometry(f4Width, 0.7, f4Length), mats.serverMat);
  f4FloorMesh.position.set(0, floorH * 3 - 0.35, -8);
  f4FloorMesh.receiveShadow = true;
  f4Group.add(f4FloorMesh);

  createRailing(f4Group, 0, floorH * 3, 12, f4Width, false);

  createWallMesh(f4Group, mats.wallMat, f4Width + wallThick, 9.5, wallThick, 0, floorH * 3 + 4.75, -bLength / 2);
  createWallMesh(f4Group, mats.wallMat, wallThick, 9.5, f4Length, -f4Width / 2, floorH * 3 + 4.75, -8);
  createWallMesh(f4Group, mats.wallMat, wallThick, 9.5, f4Length, f4Width / 2, floorH * 3 + 4.75, -8);

  create3DRoomBadge(f4Group, '💾 4F: SERVER VAULT & DATA CENTER', -16, floorH * 3 + 10.2, -14);
  create3DRoomBadge(f4Group, '💼 4F: EXECUTIVE CORPORATE OFFICES', 16, floorH * 3 + 10.2, -14);

  createServerRack(f4Group, -22, floorH * 3, -18, 0, false);
  createServerRack(f4Group, -16, floorH * 3, -18, 0, false);
  createServerRack(f4Group, -10, floorH * 3, -18, 0.2, true);
  createOverturnedDesk(f4Group, 18, floorH * 3, -16);
  createRubbleField(f4Group, mats.drywallMat, mats.wallMat, 0, -12, 16, 7.0, floorH * 3);

  createStaircase(f4Group, -3.0, floorH * 3, 6, 14, floorH * 4);

  // ==================== STOREY 5: ROOFTOP HELIPAD & SKY DECK ====================
  const f5Width = 76;
  const f5Length = 52;
  const f5FloorMesh = new THREE.Mesh(new THREE.BoxGeometry(f5Width, 0.8, f5Length), mats.concreteMat);
  f5FloorMesh.position.set(0, floorH * 4 - 0.4, 0);
  f5FloorMesh.receiveShadow = true;
  f5Group.add(f5FloorMesh);

  // Perimeter security railings on all 4 sides
  createRailing(f5Group, 0, floorH * 4, -f5Length / 2, f5Width, false);
  createRailing(f5Group, 0, floorH * 4, f5Length / 2, f5Width, false);
  createRailing(f5Group, -f5Width / 2, floorH * 4, 0, f5Length, true);
  createRailing(f5Group, f5Width / 2, floorH * 4, 0, f5Length, true);

  create3DRoomBadge(f5Group, '🚁 5F: EMERGENCY ROOFTOP HELIPAD', 0, floorH * 4 + 11.5, 0);
  create3DRoomBadge(f5Group, '📡 5F: COMMUNICATIONS SKY DECK', -24, floorH * 4 + 11.5, -14);

  // Giant Painted Helipad "H"
  createHelipadH(f5Group, 0, floorH * 4 + 0.05, 0, 14);

  // Rooftop Infrastructure
  createAntennaTower(roofGroup, -26, floorH * 4, -16, 16);
  createHVACUnit(roofGroup, 24, floorH * 4, -16);
}

// =============================================================================
// PROCEDURAL ARCHITECTURAL MESH BUILDERS, PROPS, FURNITURE & DEBRIS
// =============================================================================

function createWallMesh(parent, mat, width, height, depth, x, y, z) {
  const geo = new THREE.BoxGeometry(width, height, depth);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function createConcretePillar(parent, mat, x, y, z, width = 2.4, height = 10.5) {
  const geo = new THREE.BoxGeometry(width, height, width);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y + height / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function createStaircase(parent, startX, startY, startZ, stepCount, targetY) {
  const stairGroup = new THREE.Group();
  stairGroup.position.set(startX, startY, startZ);

  const treadWidth = 5.4;
  const treadDepth = 1.35;
  const treadHeight = 0.35;
  const stepRise = (targetY - startY) / stepCount;

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x8B5A2B, roughness: 0.7 });
  const railMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.5 });

  for (let i = 0; i < stepCount; i++) {
    const treadMesh = new THREE.Mesh(new THREE.BoxGeometry(treadWidth, treadHeight, treadDepth), woodMat);
    const stepY = i * stepRise + treadHeight / 2;
    const stepZ = -i * treadDepth;
    treadMesh.position.set(0, stepY, stepZ);
    treadMesh.castShadow = true;
    treadMesh.receiveShadow = true;
    stairGroup.add(treadMesh);

    if (i % 2 === 0) {
      [-treadWidth / 2 + 0.15, treadWidth / 2 - 0.15].forEach((bx) => {
        const postMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.8, 8), railMat);
        postMesh.position.set(bx, stepY + 1.4, stepZ);
        stairGroup.add(postMesh);
      });
    }
  }

  const totalRun = stepCount * treadDepth;
  const railLen = Math.hypot(targetY - startY, totalRun);
  const railAngle = Math.atan2(targetY - startY, totalRun);

  [-treadWidth / 2 + 0.15, treadWidth / 2 - 0.15].forEach((rx) => {
    const railMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, railLen, 8), railMat);
    railMesh.position.set(rx, (targetY - startY) / 2 + 1.4, -totalRun / 2);
    railMesh.rotation.x = -railAngle;
    stairGroup.add(railMesh);
  });

  parent.add(stairGroup);
}

function createRailing(parent, x, y, z, length, isZAxis = true) {
  const railMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6, roughness: 0.4 });
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const topRail = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, length, 8), railMat);
  if (isZAxis) {
    topRail.rotation.x = Math.PI / 2;
  } else {
    topRail.rotation.z = Math.PI / 2;
  }
  topRail.position.set(0, 2.4, 0);
  group.add(topRail);

  const posts = 6;
  for (let p = 0; p <= posts; p++) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 8), railMat);
    const offset = (p / posts - 0.5) * length;
    if (isZAxis) {
      post.position.set(0, 1.2, offset);
    } else {
      post.position.set(offset, 1.2, 0);
    }
    group.add(post);
  }

  parent.add(group);
}

function createRoofTruss(parent, mat, cx, cy, cz, width) {
  const trussGroup = new THREE.Group();
  trussGroup.position.set(cx, cy, cz);

  const apexH = 7.0;
  const halfW = width / 2;
  const rafterLen = Math.hypot(halfW, apexH);
  const angle = Math.atan2(apexH, halfW);

  const bottomBeam = new THREE.Mesh(new THREE.BoxGeometry(width, 0.45, 0.45), mat);
  bottomBeam.position.set(0, 0, 0);
  bottomBeam.castShadow = true;
  trussGroup.add(bottomBeam);

  const leftRafter = new THREE.Mesh(new THREE.BoxGeometry(rafterLen, 0.45, 0.45), mat);
  leftRafter.position.set(-halfW / 2, apexH / 2, 0);
  leftRafter.rotation.z = angle;
  leftRafter.castShadow = true;
  trussGroup.add(leftRafter);

  const rightRafter = new THREE.Mesh(new THREE.BoxGeometry(rafterLen, 0.45, 0.45), mat);
  rightRafter.position.set(halfW / 2, apexH / 2, 0);
  rightRafter.rotation.z = -angle;
  rightRafter.castShadow = true;
  trussGroup.add(rightRafter);

  const kingPost = new THREE.Mesh(new THREE.BoxGeometry(0.4, apexH, 0.4), mat);
  kingPost.position.set(0, apexH / 2, 0);
  trussGroup.add(kingPost);

  parent.add(trussGroup);
}

function createDamagedSofa(parent, fabricMat, x, y, z, rotY) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;

  const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(8.5, 1.2, 3.6), fabricMat);
  baseMesh.position.set(0, 0.6, 0);
  baseMesh.castShadow = true;
  group.add(baseMesh);

  const backMesh = new THREE.Mesh(new THREE.BoxGeometry(8.5, 2.6, 1.0), fabricMat);
  backMesh.position.set(0, 2.2, -1.3);
  backMesh.rotation.x = -0.15;
  backMesh.castShadow = true;
  group.add(backMesh);

  [-4.1, 4.1].forEach((ax) => {
    const armMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 3.6), fabricMat);
    armMesh.position.set(ax, 1.5, 0);
    armMesh.castShadow = true;
    group.add(armMesh);
  });

  group.rotation.z = 0.08;
  parent.add(group);
}

function createCollapsedBed(parent, woodMat, x, y, z, rotY) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;

  const frameMesh = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.8, 9.5), woodMat);
  frameMesh.position.set(0, 0.4, 0);
  frameMesh.castShadow = true;
  group.add(frameMesh);

  const headMesh = new THREE.Mesh(new THREE.BoxGeometry(8.5, 3.6, 0.8), woodMat);
  headMesh.position.set(0, 2.2, -4.5);
  headMesh.castShadow = true;
  group.add(headMesh);

  const mattressMat = new THREE.MeshStandardMaterial({ color: 0xE2E8F0, roughness: 0.8 });
  const mattressMesh = new THREE.Mesh(new THREE.BoxGeometry(8.0, 1.4, 9.0), mattressMat);
  mattressMesh.position.set(0, 1.4, 0.2);
  mattressMesh.rotation.x = 0.08;
  mattressMesh.rotation.z = -0.12;
  mattressMesh.castShadow = true;
  group.add(mattressMesh);

  parent.add(group);
}

function createHospitalBed(parent, x, y, z, rotY = 0) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x94A3B8, metalness: 0.8, roughness: 0.3 });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.5, 9.2), frameMat);
  frame.position.set(0, 0.9, 0);
  frame.castShadow = true;
  group.add(frame);

  // Legs
  [[-2.1, -4.2], [2.1, -4.2], [-2.1, 4.2], [2.1, 4.2]].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.9, 8), frameMat);
    leg.position.set(lx, 0.45, lz);
    group.add(leg);
  });

  const mattressMat = new THREE.MeshStandardMaterial({ color: 0x38BDF8, roughness: 0.5 });
  const mattress = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.9, 8.8), mattressMat);
  mattress.position.set(0, 1.6, 0);
  mattress.rotation.x = 0.06;
  mattress.castShadow = true;
  group.add(mattress);

  // Headboard
  const headboard = new THREE.Mesh(new THREE.BoxGeometry(4.8, 1.8, 0.3), frameMat);
  headboard.position.set(0, 1.8, -4.5);
  group.add(headboard);

  parent.add(group);
}

function createIVPole(parent, x, y, z) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xE2E8F0, metalness: 0.9, roughness: 0.1 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 7.5, 8), chromeMat);
  pole.position.set(0, 3.75, 0);
  group.add(pole);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.2, 8), chromeMat);
  base.position.set(0, 0.1, 0);
  group.add(base);

  // Fluid bag
  const bagMat = new THREE.MeshStandardMaterial({ color: 0xBAE6FD, transparent: true, opacity: 0.85 });
  const bag = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.25), bagMat);
  bag.position.set(0.35, 6.8, 0);
  group.add(bag);

  parent.add(group);
}

function createMedicalMonitor(parent, x, y, z, rotY = 0) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.5 });
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 4.0, 8), bodyMat);
  stand.position.set(0, 2.0, 0);
  group.add(stand);

  const screenGeo = new THREE.BoxGeometry(2.4, 1.6, 0.4);
  const screenMat = new THREE.MeshBasicMaterial({ color: 0x10B981 });
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.set(0, 4.2, 0);
  group.add(screen);

  parent.add(group);
}

function createReceptionDesk(parent, x, y, z, width = 14) {
  const deskMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 });
  const topMat = new THREE.MeshStandardMaterial({ color: 0xF1F5F9, roughness: 0.2 });

  const desk = new THREE.Mesh(new THREE.BoxGeometry(width, 3.2, 3.0), deskMat);
  desk.position.set(x, y + 1.6, z);
  desk.castShadow = true;
  parent.add(desk);

  const top = new THREE.Mesh(new THREE.BoxGeometry(width + 0.4, 0.35, 3.4), topMat);
  top.position.set(x, y + 3.35, z);
  top.castShadow = true;
  parent.add(top);
}

function createMedicineCabinet(parent, x, y, z, tilted = false) {
  const mat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6, roughness: 0.4 });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(4.8, 8.5, 2.2), mat);
  mesh.position.set(x, y + 4.25, z);
  if (tilted) mesh.rotation.set(0.1, 0.15, -0.25);
  mesh.castShadow = true;
  parent.add(mesh);
}

function createLabBench(parent, x, y, z, width = 12) {
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.6 });
  const topMat = new THREE.MeshStandardMaterial({ color: 0x0F172A, roughness: 0.2, metalness: 0.3 });

  const bench = new THREE.Mesh(new THREE.BoxGeometry(width, 2.8, 3.4), baseMat);
  bench.position.set(x, y + 1.4, z);
  bench.castShadow = true;
  parent.add(bench);

  const top = new THREE.Mesh(new THREE.BoxGeometry(width + 0.4, 0.35, 3.8), topMat);
  top.position.set(x, y + 2.95, z);
  parent.add(top);
}

function createGeneratorUnit(parent, x, y, z) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xD97706, roughness: 0.5, metalness: 0.4 });
  const genBody = new THREE.Mesh(new THREE.BoxGeometry(8.5, 4.5, 5.0), bodyMat);
  genBody.position.set(0, 2.25, 0);
  genBody.castShadow = true;
  group.add(genBody);

  const exhaustMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, metalness: 0.8 });
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 3.0, 8), exhaustMat);
  pipe.position.set(-2.5, 5.5, -1.2);
  group.add(pipe);

  parent.add(group);
}

function createServerRack(parent, x, y, z, rotY = 0, knockedOver = false) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;

  const rackMat = new THREE.MeshStandardMaterial({ color: 0x0F172A, metalness: 0.7, roughness: 0.3 });
  const rack = new THREE.Mesh(new THREE.BoxGeometry(3.2, 8.5, 3.2), rackMat);
  rack.position.set(0, 4.25, 0);
  rack.castShadow = true;
  group.add(rack);

  // Blinking green/blue LED strips
  const ledGeo = new THREE.BoxGeometry(2.8, 0.12, 0.05);
  const ledMat = new THREE.MeshBasicMaterial({ color: 0x00F0FF });
  for (let s = 1; s <= 7; s++) {
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(0, s * 1.05 + 0.3, 1.62);
    group.add(led);
  }

  if (knockedOver) {
    group.rotation.set(0.3, rotY, -1.1);
  }

  parent.add(group);
}

function createHelipadH(parent, x, y, z, radius = 12) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  // Outer yellow circle
  const ringGeo = new THREE.RingGeometry(radius - 0.9, radius, 48);
  const yellowMat = new THREE.MeshBasicMaterial({ color: 0xFACC15, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(ringGeo, yellowMat);
  ring.rotation.x = -Math.PI / 2;
  group.add(ring);

  // Bold "H" letter in center
  const hMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide });
  const bar1 = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 9.0), hMat);
  bar1.rotation.x = -Math.PI / 2;
  bar1.position.set(-2.8, 0.02, 0);
  group.add(bar1);

  const bar2 = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 9.0), hMat);
  bar2.rotation.x = -Math.PI / 2;
  bar2.position.set(2.8, 0.02, 0);
  group.add(bar2);

  const cross = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 1.6), hMat);
  cross.rotation.x = -Math.PI / 2;
  cross.position.set(0, 0.02, 0);
  group.add(cross);

  parent.add(group);
}

function createHVACUnit(parent, x, y, z) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const mat = new THREE.MeshStandardMaterial({ color: 0x64748B, metalness: 0.6, roughness: 0.4 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(8.0, 4.2, 5.0), mat);
  box.position.set(0, 2.1, 0);
  box.castShadow = true;
  group.add(box);

  // Twin fans
  [-2.2, 2.2].forEach((fx) => {
    const fan = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.3, 16), mat);
    fan.position.set(fx, 4.3, 0);
    group.add(fan);
  });

  parent.add(group);
}

function createAntennaTower(parent, x, y, z, height = 16) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const mastMat = new THREE.MeshStandardMaterial({ color: 0x94A3B8, metalness: 0.9, roughness: 0.2 });
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.4, height, 8), mastMat);
  mast.position.set(0, height / 2, 0);
  group.add(mast);

  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), new THREE.MeshBasicMaterial({ color: 0xEF4444 }));
  beacon.position.set(0, height + 0.3, 0);
  group.add(beacon);

  parent.add(group);
}

function createSingleBed(parent, x, y, z) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350F, roughness: 0.7 });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.7, 8.5), woodMat);
  frame.position.set(0, 0.35, 0);
  group.add(frame);

  const mattressMat = new THREE.MeshStandardMaterial({ color: 0x93C5FD, roughness: 0.8 });
  const mattress = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.1, 8.0), mattressMat);
  mattress.position.set(0, 1.1, 0);
  mattress.rotation.z = 0.08;
  group.add(mattress);

  parent.add(group);
}

function createTiltedWardrobe(parent, x, y, z) {
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x5C4033, roughness: 0.6 });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(5.2, 8.5, 2.6), woodMat);
  mesh.position.set(x, y + 4.25, z);
  mesh.rotation.z = -0.14;
  mesh.castShadow = true;
  parent.add(mesh);
}

function createOverturnedDesk(parent, x, y, z) {
  const deskMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.4, 3.2), deskMat);
  mesh.position.set(x, y + 0.6, z);
  mesh.rotation.set(0.2, 0.3, -0.4);
  mesh.castShadow = true;
  parent.add(mesh);
}

function createKitchenCounter(parent, x, z) {
  const counterMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 });
  const counterTopMat = new THREE.MeshStandardMaterial({ color: 0xF1F5F9, roughness: 0.25 });

  const counterBase = new THREE.Mesh(new THREE.BoxGeometry(14, 2.6, 2.8), counterMat);
  counterBase.position.set(x, 1.3, z);
  counterBase.castShadow = true;
  parent.add(counterBase);

  const counterTop = new THREE.Mesh(new THREE.BoxGeometry(14.4, 0.3, 3.0), counterTopMat);
  counterTop.position.set(x, 2.7, z);
  parent.add(counterTop);

  const sinkMesh = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.4, 2.0),
    new THREE.MeshStandardMaterial({ color: 0x94A3B8, metalness: 0.9, roughness: 0.2 })
  );
  sinkMesh.position.set(x, 2.8, z);
  parent.add(sinkMesh);
}

function createTiltedDiningTable(parent, x, z) {
  const tableMat = new THREE.MeshStandardMaterial({ color: 0x5C4033, roughness: 0.6 });
  const diningTable = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.4, 4.0), tableMat);
  diningTable.position.set(x, 1.2, z);
  diningTable.rotation.set(0.15, 0.3, -0.2);
  diningTable.castShadow = true;
  parent.add(diningTable);
}

function createFallenBeam(parent, mat, x1, y1, z1, x2, y2, z2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dz = z2 - z1;
  const len = Math.hypot(dx, dy, dz);

  const geo = new THREE.BoxGeometry(0.7, 0.7, len);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2);
  mesh.lookAt(x2, y2, z2);
  mesh.castShadow = true;
  parent.add(mesh);
}

function createRubbleField(parent, drywallMat, brickMat, cx, cz, count, radius, baseY = 0) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * radius;
    const rx = cx + Math.cos(angle) * dist;
    const rz = cz + Math.sin(angle) * dist;

    const w = 0.8 + Math.random() * 1.6;
    const h = 0.35 + Math.random() * 0.8;
    const d = 0.7 + Math.random() * 1.4;

    const mat = Math.random() > 0.4 ? drywallMat : brickMat;
    const rubbleGeo = new THREE.BoxGeometry(w, h, d);
    const rubbleMesh = new THREE.Mesh(rubbleGeo, mat);
    rubbleMesh.position.set(rx, baseY + h / 2, rz);
    rubbleMesh.rotation.set(Math.random() * 0.4, Math.random() * Math.PI, Math.random() * 0.4);
    rubbleMesh.castShadow = true;
    rubbleMesh.receiveShadow = true;
    parent.add(rubbleMesh);
  }
}

function create3DRoomBadge(parent, label, x, y, z) {
  const canvas = document.createElement('canvas');
  canvas.width = 460;
  canvas.height = 74;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
  ctx.fillRect(0, 0, 460, 74);

  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 3.5;
  ctx.strokeRect(2, 2, 456, 70);

  ctx.fillStyle = '#38BDF8';
  ctx.font = 'bold 16px monospace';
  ctx.fillText(label, 12, 44);

  const tex = new THREE.CanvasTexture(canvas);
  const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.position.set(x, y, z);
  sprite.scale.set(8.6, 1.45, 1);
  parent.add(sprite);
}

function createCrackedPit(parent, x, y, z, radius) {
  const geo = new THREE.CircleGeometry(radius, 32);
  const tex = createCrackedTexture();
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    transparent: true,
    roughness: 0.9,
    depthWrite: false
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y, z);
  parent.add(mesh);
}

function createTriageBadgeMesh(victim, isDetected) {
  const canvas = document.createElement('canvas');
  canvas.width = 380;
  canvas.height = 145;
  const ctx = canvas.getContext('2d');

  const triageTag = (victim.triage_tag || (isDetected ? 'YELLOW' : 'RED')).toUpperCase();
  const isRed = triageTag === 'RED';
  const isYellow = triageTag === 'YELLOW';

  const themeColor = isRed ? '#EF4444' : isYellow ? '#F59E0B' : '#10B981';
  const headerBg = isRed
    ? 'rgba(239, 68, 68, 0.95)'
    : isYellow
    ? 'rgba(245, 158, 11, 0.95)'
    : 'rgba(16, 185, 129, 0.95)';

  const tagLabel = isRed ? '🔴 START: RED (IMMEDIATE)' : isYellow ? '🟡 START: YELLOW (DELAYED)' : '🟢 START: GREEN (MINOR)';
  const headerText = isDetected
    ? `${tagLabel} • RESCUED`
    : `${tagLabel} • UNLOCATED`;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
  ctx.fillRect(0, 0, 380, 145);

  ctx.strokeStyle = themeColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 376, 141);

  ctx.fillStyle = headerBg;
  ctx.fillRect(0, 0, 380, 34);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(headerText, 12, 23);

  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 13.5px monospace';
  ctx.fillText(victim.name || `Human Casualty #${victim.id}`, 14, 60);

  ctx.fillStyle = '#38BDF8';
  ctx.font = '12px monospace';
  ctx.fillText(
    `Temp: ${victim.vital_temp_c || 37.0}°C • HR: ${victim.pulse_bpm || 80} BPM • Urgency: ${(victim.urgency ?? 0.85).toFixed(2)}`,
    14,
    86
  );

  // START Triage Priority & Payload delivery status
  const payloadDelivered = victim.payload_status === 'DELIVERED';
  if (payloadDelivered) {
    ctx.fillStyle = '#34D399';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`📦 BEACON & AID KIT: DELIVERED BY ${victim.payload_delivered_by || 'UAV'}`, 14, 114);
  } else if (isRed || isYellow) {
    ctx.fillStyle = '#FBBF24';
    ctx.font = 'bold 11.5px monospace';
    ctx.fillText(`⏳ EMERGENCY PAYLOAD: DISPATCH IN PROGRESS`, 14, 114);
  } else {
    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 11.5px monospace';
    ctx.fillText(`✓ CASUALTY STABLE • AWAITING EVACUATION`, 14, 114);
  }

  // Triage description sub-bar
  ctx.fillStyle = '#94A3B8';
  ctx.font = '10px monospace';
  ctx.fillText(
    victim.triage_desc ||
      (isRed
        ? 'Immediate life-threat: triage critical priority'
        : isYellow
        ? 'Urgent attention required: trapped status'
        : 'Minor ambulatory condition: stable'),
    14,
    134
  );

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(7.8, 3.0, 1);
  return sprite;
}

/**
 * 3D Emergency First-Aid Radio Beacon Kit
 * Deployed automatically beside RED / YELLOW casualties by UAV
 */
function createBeaconKitMesh() {
  const kitGroup = new THREE.Group();
  kitGroup.name = 'beaconKit';

  // 1. Waterproof Pelican-style First-Aid Case (Tactical Red Box)
  const caseGeo = new THREE.BoxGeometry(1.6, 0.7, 1.2);
  const caseMat = new THREE.MeshStandardMaterial({
    color: 0xEF4444,
    roughness: 0.35,
    metalness: 0.25
  });
  const caseMesh = new THREE.Mesh(caseGeo, caseMat);
  caseMesh.castShadow = true;
  kitGroup.add(caseMesh);

  // 2. White First-Aid Cross markings on top
  const crossVGeo = new THREE.BoxGeometry(0.24, 0.05, 0.7);
  const crossHGeo = new THREE.BoxGeometry(0.7, 0.05, 0.24);
  const crossMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
  const crossV = new THREE.Mesh(crossVGeo, crossMat);
  crossV.position.y = 0.36;
  const crossH = new THREE.Mesh(crossHGeo, crossMat);
  crossH.position.y = 0.36;
  kitGroup.add(crossV);
  kitGroup.add(crossH);

  // 3. Tactical RF Whip Antenna
  const antGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.8, 8);
  const antMat = new THREE.MeshBasicMaterial({ color: 0x1E293B });
  const antenna = new THREE.Mesh(antGeo, antMat);
  antenna.position.set(0.65, 0.9, -0.45);
  antenna.rotation.z = -0.15;
  kitGroup.add(antenna);

  // 4. Strobe Beacon LED at top of antenna
  const ledGeo = new THREE.SphereGeometry(0.2, 12, 12);
  const ledMat = new THREE.MeshBasicMaterial({
    color: 0x00FF88,
    transparent: true,
    opacity: 0.9
  });
  const ledMesh = new THREE.Mesh(ledGeo, ledMat);
  ledMesh.name = 'beaconLed';
  ledMesh.position.set(0.78, 1.8, -0.45);
  kitGroup.add(ledMesh);

  // 5. RF Wave Ping Ring expanding on floor
  const pingGeo = new THREE.RingGeometry(0.4, 2.2, 24);
  const pingMat = new THREE.MeshBasicMaterial({
    color: 0x10B981,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide
  });
  const pingRing = new THREE.Mesh(pingGeo, pingMat);
  pingRing.name = 'beaconPing';
  pingRing.rotation.x = -Math.PI / 2;
  pingRing.position.y = -0.3;
  kitGroup.add(pingRing);

  return kitGroup;
}

/**
 * Vertical Stairwell RF Waveguide Shaft
 * Central line-of-sight propagation corridor across all building floors
 */
function buildStairwellWaveguide(parentGroup, numFloors, stairwellShaftRef) {
  const shaftGroup = new THREE.Group();
  shaftGroup.name = 'stairwellWaveguide';

  const totalHeight = numFloors * 11.2;
  const shaftRadius = 6.2;
  const stairwellX = -0.8;
  const stairwellZ = 0.8;

  // 1. Translucent Holographic Waveguide Cylinder
  const cylGeo = new THREE.CylinderGeometry(shaftRadius, shaftRadius, totalHeight, 24, numFloors, true);
  const cylMat = new THREE.MeshBasicMaterial({
    color: 0x00F0FF,
    wireframe: true,
    transparent: true,
    opacity: 0.22
  });
  const cylMesh = new THREE.Mesh(cylGeo, cylMat);
  cylMesh.position.set(stairwellX, totalHeight / 2, stairwellZ);
  shaftGroup.add(cylMesh);

  // 2. Soft inner volumetric RF glow cylinder
  const innerGeo = new THREE.CylinderGeometry(shaftRadius * 0.95, shaftRadius * 0.95, totalHeight, 16, 1, true);
  const innerMat = new THREE.MeshBasicMaterial({
    color: 0x0284C7,
    transparent: true,
    opacity: 0.06,
    side: THREE.DoubleSide
  });
  const innerMesh = new THREE.Mesh(innerGeo, innerMat);
  innerMesh.position.set(stairwellX, totalHeight / 2, stairwellZ);
  shaftGroup.add(innerMesh);

  // 3. Ring guidelines at each floor slab boundary
  for (let f = 1; f <= numFloors + 1; f++) {
    const ringY = (f - 1) * 11.2;
    const ringGeo = new THREE.RingGeometry(shaftRadius - 0.2, shaftRadius + 0.3, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38BDF8,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(stairwellX, ringY, stairwellZ);
    shaftGroup.add(ring);
  }

  // 4. Traveling RF Pulse Beam Ring
  const pulseGeo = new THREE.TorusGeometry(shaftRadius - 0.1, 0.25, 12, 32);
  const pulseMat = new THREE.MeshBasicMaterial({
    color: 0x00F0FF,
    transparent: true,
    opacity: 0.85
  });
  const pulseRing = new THREE.Mesh(pulseGeo, pulseMat);
  pulseRing.rotation.x = Math.PI / 2;
  pulseRing.position.set(stairwellX, 0, stairwellZ);
  shaftGroup.add(pulseRing);

  // 5. 3D Holographic Label at top of shaft
  create3DRoomBadge(
    shaftGroup,
    '📶 CENTRAL STAIRWELL RF WAVEGUIDE SHAFT (LOS)',
    stairwellX,
    totalHeight + 2.5,
    stairwellZ
  );

  shaftGroup.userData = {
    totalHeight,
    pulseRing
  };

  parentGroup.add(shaftGroup);
  if (stairwellShaftRef) {
    stairwellShaftRef.current = shaftGroup;
  }
}


function createQuadcopterMesh(colorHex, idx, droneId, role) {
  const group = new THREE.Group();

  // 1. High-Visibility Pulsing Colored Halo Ring
  const haloGeo = new THREE.TorusGeometry(2.4, 0.14, 16, 32);
  const haloMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(colorHex),
    transparent: true,
    opacity: 0.90
  });
  const haloMesh = new THREE.Mesh(haloGeo, haloMat);
  haloMesh.rotation.x = Math.PI / 2;
  group.add(haloMesh);

  // 2. Downward Active Sensor Scanning Light Cone
  const scanConeGeo = new THREE.ConeGeometry(3.2, 5.0, 16, 1, true);
  const scanConeMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(colorHex),
    transparent: true,
    opacity: 0.16,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const scanCone = new THREE.Mesh(scanConeGeo, scanConeMat);
  scanCone.position.y = -2.5;
  group.add(scanCone);

  // 3. Central Drone Carbon Fiber Fuselage
  const bodyGeo = new THREE.SphereGeometry(1.1, 16, 12);
  bodyGeo.scale(1.3, 0.45, 1.3);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1E293B,
    roughness: 0.3,
    metalness: 0.8
  });
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  bodyMesh.castShadow = true;
  group.add(bodyMesh);

  // 4. Glowing Colored Top Navigational Dome
  const domeGeo = new THREE.SphereGeometry(0.65, 16, 12);
  const domeMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(colorHex)
  });
  const domeMesh = new THREE.Mesh(domeGeo, domeMat);
  domeMesh.position.y = 0.35;
  group.add(domeMesh);

  // 5. X-Frame Quadcopter Arms
  const armMat = new THREE.MeshStandardMaterial({ color: 0x0F172A, roughness: 0.4 });
  const armGeo = new THREE.CylinderGeometry(0.12, 0.12, 4.4, 8);
  const arm1 = new THREE.Mesh(armGeo, armMat);
  arm1.rotation.z = Math.PI / 2;
  arm1.rotation.y = Math.PI / 4;
  group.add(arm1);

  const arm2 = new THREE.Mesh(armGeo, armMat);
  arm2.rotation.z = Math.PI / 2;
  arm2.rotation.y = -Math.PI / 4;
  group.add(arm2);

  // 6. 4 Rotor Guards & Spinning Propeller Blades
  const ringGeo = new THREE.TorusGeometry(1.0, 0.08, 8, 24);
  const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(colorHex) });

  const rotorBlades = [];
  const armDist = 1.55;
  const rotorPositions = [
    [armDist, armDist],
    [-armDist, armDist],
    [armDist, -armDist],
    [-armDist, -armDist]
  ];

  rotorPositions.forEach(([rx, rz]) => {
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(rx, 0.1, rz);
    group.add(ring);

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.28, 8), bodyMat);
    hub.position.set(rx, 0.12, rz);
    group.add(hub);

    const bladeGeo = new THREE.BoxGeometry(1.8, 0.04, 0.2);
    const bladeMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    hub.add(blade);
    rotorBlades.push(hub);
  });

  // 7. Compact Floating 3D Tag Billboard
  const tagCanvas = document.createElement('canvas');
  tagCanvas.width = 240;
  tagCanvas.height = 60;
  const tagCtx = tagCanvas.getContext('2d');
  tagCtx.fillStyle = 'rgba(15, 23, 42, 0.90)';
  tagCtx.fillRect(0, 0, 240, 60);
  tagCtx.strokeStyle = colorHex;
  tagCtx.lineWidth = 3;
  tagCtx.strokeRect(2, 2, 236, 56);
  tagCtx.fillStyle = colorHex;
  tagCtx.font = 'bold 22px monospace';
  tagCtx.fillText(droneId || `UAV-${idx + 1}`, 12, 38);

  const tagTex = new THREE.CanvasTexture(tagCanvas);
  const tagSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tagTex, transparent: true }));
  tagSprite.scale.set(4.0, 1.0, 1.0);
  tagSprite.position.set(0, 2.4, 0);
  group.add(tagSprite);

  group.userData = { rotors: rotorBlades, halo: haloMesh };
  return group;
}

function createProceduralBrickTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#9FB0C0';
  ctx.fillRect(0, 0, 512, 512);

  const rows = 16;
  const rowHeight = 512 / rows;
  const brickWidth = 64;

  ctx.strokeStyle = '#52667A';
  ctx.lineWidth = 3;

  for (let r = 0; r < rows; r++) {
    const y = r * rowHeight;
    const offset = (r % 2) * (brickWidth / 2);

    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();

    for (let x = -brickWidth; x < 512 + brickWidth; x += brickWidth) {
      const bx = x + offset;
      ctx.beginPath();
      ctx.moveTo(bx, y);
      ctx.lineTo(bx, y + rowHeight);
      ctx.stroke();

      const shade = Math.floor((Math.sin(r * 13 + x * 7) + 1) * 15);
      ctx.fillStyle = `rgba(0, 0, 0, ${0.04 + shade / 300})`;
      ctx.fillRect(bx + 2, y + 2, brickWidth - 4, rowHeight - 4);
    }
  }

  return new THREE.CanvasTexture(canvas);
}

function createProceduralTileTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#6E8B9F';
  ctx.fillRect(0, 0, 512, 512);

  const tileSize = 64;
  ctx.strokeStyle = '#435B6D';
  ctx.lineWidth = 2.5;

  for (let x = 0; x <= 512; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }

  for (let y = 0; y <= 512; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  for (let i = 0; i < 400; i++) {
    const px = Math.random() * 512;
    const py = Math.random() * 512;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(px, py, 1.5, 1.5);
  }

  return new THREE.CanvasTexture(canvas);
}

function createProceduralWoodTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#8B5A2B';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#5C3A1E';
  ctx.lineWidth = 1.5;

  for (let y = 0; y < 256; y += 12) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(80, y + 4, 180, y - 4, 256, y);
    ctx.stroke();
  }

  return new THREE.CanvasTexture(canvas);
}

function createCrackedTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
  grad.addColorStop(0, 'rgba(40, 55, 70, 0.95)');
  grad.addColorStop(0.7, 'rgba(80, 100, 120, 0.8)');
  grad.addColorStop(1, 'rgba(110, 139, 159, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(128, 128, 120, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 3;
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    ctx.beginPath();
    ctx.moveTo(128, 128);
    let cx = 128;
    let cy = 128;
    for (let step = 0; step < 4; step++) {
      cx += Math.cos(angle + (Math.random() - 0.5) * 0.5) * 25;
      cy += Math.sin(angle + (Math.random() - 0.5) * 0.5) * 25;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  return new THREE.CanvasTexture(canvas);
}
