import React, { useRef, useEffect, useState } from 'react';

const DRONE_PALETTE = [
  '#00F0FF', // Alpha: Vibrant Electric Cyan
  '#F59E0B', // Beta: Bright Amber Gold
  '#10B981', // Gamma: Vivid Emerald Mint
  '#EC4899', // Delta: Radiant Neon Pink
  '#8B5CF6', // Epsilon: Deep Violet Purple
  '#3B82F6', // Zeta: Royal Aerospace Blue
  '#14B8A6', // Eta: Radiant Teal
  '#F97316', // Theta: Vivid Orange
  '#A855F7', // Iota: Bright Violet
  '#84CC16', // Kappa: Lime Green
  '#E11D48', // Lambda: Crimson Rose
  '#0284C7'  // Mu: Sky Blue
];

export const CanvasSimulation = ({
  simState,
  selectedDroneId,
  onSelectDrone,
  showCoverage = true,
  showCommLinks = true,
  showSmoke = true
}) => {
  const canvasRef = useRef(null);
  const [viewMode, setViewMode] = useState('CUTAWAY'); // 'CUTAWAY', 'BLUEPRINT', 'ELEVATION'
  const [selectedFloor, setSelectedFloor] = useState('ALL');
  const [showImageBackdrop, setShowImageBackdrop] = useState(true);
  const [showBeams, setShowBeams] = useState(true);

  // Background building image ref
  const bgImageRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Smooth 60 FPS Drone Motion Interpolation & Animation State
  const droneAnimRef = useRef({});
  const animFrameRef = useRef(null);
  const timeRef = useRef(0);

  // Load realistic building image
  useEffect(() => {
    const img = new Image();
    img.src = '/disaster_building.jpg';
    img.onload = () => {
      bgImageRef.current = img;
      setImageLoaded(true);
    };
    img.onerror = () => {
      // Fallback try png
      const pngImg = new Image();
      pngImg.src = '/disaster_building.png';
      pngImg.onload = () => {
        bgImageRef.current = pngImg;
        setImageLoaded(true);
      };
    };
  }, []);

  // Update target coordinates into droneAnimRef when simState updates
  useEffect(() => {
    if (!simState?.drones) return;
    const current = droneAnimRef.current;
    simState.drones.forEach((d) => {
      if (!current[d.drone_id]) {
        current[d.drone_id] = {
          x: d.x,
          y: d.y,
          z: d.z || 10,
          targetX: d.x,
          targetY: d.y,
          targetZ: d.z || 10,
          angle: 0,
          rotorAngle: Math.random() * Math.PI * 2,
          speed: 1.0
        };
      } else {
        const item = current[d.drone_id];
        item.targetX = d.x;
        item.targetY = d.y;
        item.targetZ = d.z || 10;
        const dx = d.x - item.x;
        const dy = d.y - item.y;
        if (Math.hypot(dx, dy) > 1.5) {
          item.angle = Math.atan2(dy, dx);
          item.speed = Math.min(3.5, Math.hypot(dx, dy));
        }
      }
    });
  }, [simState]);

  // Main 60 FPS Continuous Render & Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 800;
    const height = 600;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;
      timeRef.current += 0.016;
      const t = timeRef.current;

      // Smoothly interpolate all drone positions (lerp)
      const anims = droneAnimRef.current;
      Object.keys(anims).forEach((id) => {
        const item = anims[id];
        item.x += (item.targetX - item.x) * 0.12;
        item.y += (item.targetY - item.y) * 0.12;
        item.z += (item.targetZ - item.z) * 0.12;
        item.rotorAngle += 0.45; // Fast continuous rotor spin
      });

      // Clear Canvas to Tactical Dark Radar Background
      ctx.fillStyle = '#060A14';
      ctx.fillRect(0, 0, width, height);

      const env = simState?.environment;
      const numFloors = env?.num_floors || 3;
      const rooms = env?.rooms || [];
      const drones = simState?.drones || [];

      // =========================================================================
      // 1. RENDER BUILDING BACKDROP (Based on Selected View Mode)
      // =========================================================================

      if (viewMode === 'CUTAWAY') {
        // --- MODE A: 3D PHOTOREALISTIC DISASTER BUILDING CUTAWAY ---
        if (showImageBackdrop && bgImageRef.current) {
          ctx.save();
          ctx.globalAlpha = 0.88;
          ctx.drawImage(bgImageRef.current, 0, 0, width, height);
          ctx.restore();

          // Dark Tactical Vignette Overlay to maintain contrast with HUD
          const vignette = ctx.createRadialGradient(width / 2, height / 2, 180, width / 2, height / 2, 440);
          vignette.addColorStop(0, 'rgba(6, 10, 20, 0.25)');
          vignette.addColorStop(1, 'rgba(6, 10, 20, 0.75)');
          ctx.fillStyle = vignette;
          ctx.fillRect(0, 0, width, height);
        } else {
          // Tactical Vector Cutaway Backdrop if image toggle is off
          drawProceduralCutawayBuilding(ctx, width, height, numFloors, rooms, selectedFloor);
        }

        // Draw architectural room tags and elevator overlay
        drawArchitecturalRoomOverlays(ctx, rooms, selectedFloor, true);

      } else if (viewMode === 'BLUEPRINT') {
        // --- MODE B: CAD STRUCTURAL FLOORPLAN BLUEPRINT ---
        drawCADBlueprintFloorplan(ctx, width, height, rooms, selectedFloor, env?.obstacles);

      } else {
        // --- MODE C: MULTISTOREY VERTICAL ELEVATION VIEW (L1 to L5) ---
        drawVerticalElevationView(ctx, width, height, numFloors, env, drones, anims, selectedFloor);
      }

      // =========================================================================
      // 2. RADAR SEARCH COVERAGE CONES & HEATMAP
      // =========================================================================
      if (showCoverage && viewMode !== 'ELEVATION') {
        drones.forEach((d) => {
          const anim = anims[d.drone_id] || d;
          const radGrad = ctx.createRadialGradient(anim.x, anim.y, 8, anim.x, anim.y, 75);
          radGrad.addColorStop(0, 'rgba(6, 182, 212, 0.22)');
          radGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.08)');
          radGrad.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
          ctx.fillStyle = radGrad;
          ctx.beginPath();
          ctx.arc(anim.x, anim.y, 75, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // =========================================================================
      // 3. VOLUMETRIC SMOKE & CHEMICAL HAZARD PLUMES
      // =========================================================================
      if (showSmoke && env?.smoke_zones && viewMode !== 'ELEVATION') {
        env.smoke_zones.forEach((sm, smIdx) => {
          const pulse = Math.sin(t * 1.5 + smIdx) * 6;
          const r = sm.radius + pulse;
          const radGrad = ctx.createRadialGradient(sm.x, sm.y, 10, sm.x, sm.y, r);
          radGrad.addColorStop(0, 'rgba(148, 163, 184, 0.48)');
          radGrad.addColorStop(0.5, 'rgba(100, 116, 139, 0.25)');
          radGrad.addColorStop(1, 'rgba(15, 23, 42, 0.0)');
          ctx.fillStyle = radGrad;
          ctx.beginPath();
          ctx.arc(sm.x, sm.y, r, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
          ctx.beginPath();
          ctx.arc(sm.x, sm.y, 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#CBD5E1';
          ctx.font = '8px JetBrains Mono, monospace';
          ctx.fillText(`DENSE SMOKE ${Math.round(sm.density * 100)}%`, sm.x - 30, sm.y - 6);
        });
      }

      // =========================================================================
      // 4. P2P WIRELESS MESH COMMUNICATION LINKS (NetworkX Dynamic Graph)
      // =========================================================================
      const topology = simState?.topology;
      if (showCommLinks && topology?.edges && viewMode !== 'ELEVATION') {
        topology.edges.forEach((edge) => {
          const p1 = anims[edge.source] || drones.find((d) => d.drone_id === edge.source);
          const p2 = anims[edge.target] || drones.find((d) => d.drone_id === edge.target);
          if (p1 && p2) {
            ctx.save();
            ctx.setLineDash([4, 4]);
            const loss = edge.loss_prob || 0.03;
            ctx.strokeStyle = loss > 0.3 ? 'rgba(245, 158, 11, 0.65)' : 'rgba(0, 240, 255, 0.45)';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.restore();
          }
        });
      }

      // =========================================================================
      // 5. DRONE TRAJECTORY FLIGHT PATH TRAILS (Vibrant Assigned Colors)
      // =========================================================================
      if (viewMode !== 'ELEVATION') {
        drones.forEach((drone, idx) => {
          const droneColor = drone.assigned_color || drone.assignedColor || DRONE_PALETTE[idx % DRONE_PALETTE.length];
          const traj = drone.trajectory || [];
          if (traj.length > 1) {
            ctx.save();
            ctx.strokeStyle = droneColor;
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            traj.forEach((pt, pIdx) => {
              if (pIdx === 0) ctx.moveTo(pt.x, pt.y);
              else ctx.lineTo(pt.x, pt.y);
            });
            ctx.stroke();

            // Breadcrumb waypoints
            traj.forEach((pt, pIdx) => {
              if (pIdx % 5 === 0) {
                ctx.fillStyle = droneColor;
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
                ctx.fill();
              }
            });
            ctx.restore();
          }
        });
      }

      // =========================================================================
      // 6. HUMAN CASUALTY FIGURES (Anatomical Vector Silhouettes & Thermal Halo)
      // =========================================================================
      if (env?.victims && viewMode !== 'ELEVATION') {
        env.victims.forEach((v, vIdx) => {
          if (selectedFloor !== 'ALL' && v.floor && v.floor !== Number(selectedFloor)) return;

          ctx.save();
          const vx = v.x;
          const vy = v.y;
          const isDetected = v.detected;

          // Pulsing Thermal Infrared Glow
          const heatRadius = isDetected ? 24 : 18 + Math.sin(t * 3 + vIdx) * 3;
          const heatGrad = ctx.createRadialGradient(vx, vy, 4, vx, vy, heatRadius);
          heatGrad.addColorStop(0, isDetected ? 'rgba(16, 185, 129, 0.55)' : 'rgba(239, 68, 68, 0.65)');
          heatGrad.addColorStop(0.6, isDetected ? 'rgba(52, 211, 153, 0.20)' : 'rgba(249, 115, 22, 0.25)');
          heatGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = heatGrad;
          ctx.beginPath();
          ctx.arc(vx, vy, heatRadius, 0, Math.PI * 2);
          ctx.fill();

          // Draw Anatomical Human Figure Silhouette
          ctx.save();
          ctx.translate(vx, vy);
          const bodyColor = isDetected ? '#34D399' : '#EF4444';
          ctx.fillStyle = bodyColor;
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1;

          // Human Head
          ctx.beginPath();
          ctx.arc(0, -7, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Human Torso
          ctx.beginPath();
          ctx.moveTo(-3, -3.5);
          ctx.lineTo(3, -3.5);
          ctx.lineTo(2.5, 4.5);
          ctx.lineTo(-2.5, 4.5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Human Arms (One signaling for help, one resting)
          ctx.beginPath();
          ctx.moveTo(-3, -2);
          ctx.lineTo(-6, -6);
          ctx.moveTo(3, -2);
          ctx.lineTo(5.5, 3);
          ctx.stroke();

          // Human Legs
          ctx.beginPath();
          ctx.moveTo(-1.5, 4.5);
          ctx.lineTo(-3, 10);
          ctx.moveTo(1.5, 4.5);
          ctx.lineTo(3, 10);
          ctx.stroke();
          ctx.restore();

          // Medical Triage HUD Badge
          ctx.font = 'bold 8.5px JetBrains Mono, monospace';
          const triageTag = isDetected
            ? `✓ SURVIVOR #${vIdx + 1} [LOCATED • FL ${v.floor}]`
            : `SOS [TRAPPED • FL ${v.floor}]`;
          const tagWidth = ctx.measureText(triageTag).width;

          ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
          ctx.strokeStyle = isDetected ? '#10B981' : '#EF4444';
          ctx.lineWidth = 1;
          ctx.fillRect(vx + 10, vy - 10, tagWidth + 8, 16);
          ctx.strokeRect(vx + 10, vy - 10, tagWidth + 8, 16);

          ctx.fillStyle = isDetected ? '#34D399' : '#F87171';
          ctx.fillText(triageTag, vx + 14, vy + 2);

          // Vital Signs Subtitle
          ctx.font = '7.5px JetBrains Mono, monospace';
          ctx.fillStyle = '#94A3B8';
          ctx.fillText(
            `Temp: ${v.vital_temp_c || 37.0}°C • HR: ${v.pulse_bpm || 80} BPM`,
            vx + 10,
            vy + 16
          );
          ctx.restore();
        });
      }

      // =========================================================================
      // 7. SMOOTH CONTINUOUS DRONE QUADROTORS (60 FPS Motion, Spinners, Beams)
      // =========================================================================
      if (viewMode !== 'ELEVATION') {
        drones.forEach((drone, idx) => {
          if (selectedFloor !== 'ALL' && drone.floor && drone.floor !== Number(selectedFloor)) return;

          const anim = anims[drone.drone_id] || drone;
          const isSelected = drone.drone_id === selectedDroneId;
          const status = drone.operational_status || drone.operationalStatus || 'HEALTHY';
          const curRole = drone.current_role || drone.currentRole || 'Search and exploration';
          const isRelay = curRole === 'Communication relay';
          const droneColor = drone.assigned_color || drone.assignedColor || DRONE_PALETTE[idx % DRONE_PALETTE.length];
          const drainRate = drone.battery_drain_rate || drone.batteryDrainRate || (isRelay ? 0.10 : 0.35);

          ctx.save();
          ctx.translate(anim.x, anim.y);

          // Dynamic Forward Scanning Searchlight / LiDAR Beam
          if (showBeams && !isRelay) {
            const beamAngle = anim.angle + Math.sin(t * 3.5) * 0.22; // Smooth continuous beam sweep
            const beamDist = 65;
            const beamSpread = 0.55;

            ctx.save();
            const beamGrad = ctx.createRadialGradient(0, 0, 8, 0, 0, beamDist);
            beamGrad.addColorStop(0, 'rgba(0, 240, 255, 0.40)');
            beamGrad.addColorStop(0.5, 'rgba(0, 240, 255, 0.15)');
            beamGrad.addColorStop(1, 'rgba(0, 240, 255, 0.0)');

            ctx.fillStyle = beamGrad;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, beamDist, beamAngle - beamSpread, beamAngle + beamSpread);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          } else if (isRelay) {
            // Pulsing Eco Relay Wireless Anchor Ring
            const relayPulse = 28 + Math.sin(t * 4) * 5;
            ctx.strokeStyle = 'rgba(168, 85, 247, 0.65)';
            ctx.lineWidth = 1.8;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.arc(0, 0, relayPulse, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
          }

          // Pulsing Thruster Exhaust Glow Behind Drone
          const thrusterPulse = Math.sin(t * 12) * 2;
          ctx.fillStyle = isRelay ? 'rgba(168, 85, 247, 0.4)' : 'rgba(0, 240, 255, 0.35)';
          ctx.beginPath();
          ctx.arc(0, 0, 16 + thrusterPulse, 0, Math.PI * 2);
          ctx.fill();

          // Selected Ring Indicator
          if (isSelected) {
            ctx.strokeStyle = '#38BDF8';
            ctx.lineWidth = 2.2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.arc(0, 0, 24, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
          }

          // Drone Quadrotor Carbon-Fiber Arms
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(-11, -11);
          ctx.lineTo(11, 11);
          ctx.moveTo(-11, 11);
          ctx.lineTo(11, -11);
          ctx.stroke();

          // Rotating Propeller Blades in Drone's Distinct Vibrant Color
          const bladeRot = anim.rotorAngle || 0;
          [
            [-11, -11],
            [11, -11],
            [-11, 11],
            [11, 11]
          ].forEach(([rx, ry], rIdx) => {
            ctx.save();
            ctx.translate(rx, ry);
            ctx.rotate(bladeRot * (rIdx % 2 === 0 ? 1 : -1));

            // Propeller Blade Disk
            ctx.strokeStyle = droneColor;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(-5.5, 0);
            ctx.lineTo(5.5, 0);
            ctx.stroke();

            // Rotor Hub
            ctx.fillStyle = '#1E293B';
            ctx.beginPath();
            ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          });

          // Fuselage Core with Role Hue
          ctx.fillStyle = '#0F172A';
          ctx.strokeStyle = droneColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Health Status LED Indicator
          ctx.fillStyle =
            status === 'HEALTHY' ? '#10B981' : status === 'DEGRADED' ? '#F59E0B' : '#EF4444';
          ctx.beginPath();
          ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
          ctx.fill();

          // Drone Callout HUD Tag
          ctx.font = 'bold 9.5px JetBrains Mono, monospace';
          ctx.fillStyle = '#F8FAFC';
          ctx.fillText(drone.drone_id, 16, -6);

          // Role Badge
          ctx.save();
          ctx.fillStyle = isRelay ? 'rgba(147, 51, 234, 0.95)' : droneColor;
          ctx.fillRect(16, -2, isRelay ? 130 : 66, 14);
          ctx.fillStyle = '#0F172A';
          ctx.font = 'bold 8px JetBrains Mono, monospace';
          ctx.fillText(isRelay ? '⚡ ECO RELAY HOVER' : 'SEARCH', 19, 8.5);
          ctx.restore();

          // Live Role-Aware Battery Consumption Readout
          ctx.font = '8px JetBrains Mono, monospace';
          ctx.fillStyle = isRelay ? '#C4B5FD' : '#94A3B8';
          const drainText = isRelay ? `⚡ -0.10%/s (Eco)` : `⚡ -0.35%/s (Search)`;
          ctx.fillText(`${Math.round(drone.battery)}% • ${drainText}`, 16, 22);

          ctx.restore();
        });
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [simState, selectedDroneId, showCoverage, showCommLinks, showSmoke, selectedFloor, viewMode, showImageBackdrop, showBeams, imageLoaded]);

  // Click handler for drone selection
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !onSelectDrone) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = 800 / rect.width;
    const scaleY = 600 / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    const drones = simState?.drones || [];
    for (const d of drones) {
      const anim = droneAnimRef.current[d.drone_id] || d;
      const dist = Math.hypot(clickX - anim.x, clickY - anim.y);
      if (dist <= 30) {
        onSelectDrone(d.drone_id);
        return;
      }
    }
  };

  const env = simState?.environment;
  const numFloors = env?.num_floors || 3;
  const buildingName = env?.building_name || 'Multistorey Disaster Complex';

  return (
    <div className="relative border border-cyan-500/30 rounded-2xl overflow-hidden bg-[#060A14] shadow-[0_0_30px_rgba(6,182,212,0.15)] flex flex-col items-center justify-center">
      {/* Top Tactical HUD Banner: Building Identity & Multi-View Switchers */}
      <div className="w-full bg-[#080E1C]/95 border-b border-slate-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between text-[11px] font-mono select-none gap-2">
        <div className="flex items-center space-x-2 text-cyan-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-bold tracking-wider">{buildingName.toUpperCase()}</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">{numFloors}-STOREY STRUCTURE</span>
        </div>

        {/* View Mode Controls (3D Cutaway / CAD Blueprint / Multistorey Elevation) */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-slate-950/90 p-1 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 px-1.5 font-bold">VIEW:</span>
            <button
              onClick={() => setViewMode('CUTAWAY')}
              className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition ${
                viewMode === 'CUTAWAY'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🏢 3D Building Cutaway
            </button>
            <button
              onClick={() => setViewMode('BLUEPRINT')}
              className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition ${
                viewMode === 'BLUEPRINT'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📐 CAD Floorplan
            </button>
            <button
              onClick={() => setViewMode('ELEVATION')}
              className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition ${
                viewMode === 'ELEVATION'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🏗️ Vertical Elevation (L1-L{numFloors})
            </button>
          </div>

          {/* Floor Level Filter */}
          {viewMode !== 'ELEVATION' && (
            <div className="flex items-center space-x-1 bg-slate-950/90 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setSelectedFloor('ALL')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                  selectedFloor === 'ALL'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              {Array.from({ length: numFloors }).map((_, i) => {
                const fl = i + 1;
                return (
                  <button
                    key={fl}
                    onClick={() => setSelectedFloor(fl.toString())}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                      selectedFloor === fl.toString()
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    L{fl}
                  </button>
                );
              })}
            </div>
          )}

          {/* Visual Toggles */}
          <div className="flex items-center space-x-1">
            {viewMode === 'CUTAWAY' && (
              <button
                onClick={() => setShowImageBackdrop(!showImageBackdrop)}
                title="Toggle Real Building Photo Backdrop"
                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                  showImageBackdrop
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
              >
                🖼️ Image: {showImageBackdrop ? 'ON' : 'OFF'}
              </button>
            )}
            <button
              onClick={() => setShowBeams(!showBeams)}
              title="Toggle LiDAR/Camera Search Beams"
              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                showBeams
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              🔦 Beams
            </button>
          </div>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{ width: '100%', height: 'auto', aspectRatio: '800 / 600' }}
        className="cursor-crosshair block"
      />

      {/* Bottom Tactical Status & Quick Legend */}
      <div className="w-full bg-[#080E1C]/95 border-t border-slate-800/80 px-4 py-2 flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-400 select-none gap-2">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1 text-slate-300">
            <span>👤</span>
            <span>Human Casualty (Thermal Vitals)</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-0.5 bg-cyan-400" />
            <span>Smooth 60 FPS Trajectory</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span>Eco Relay (0.10%/s)</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Active Search (0.35%/s)</span>
          </span>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// PROCEDURAL ARCHITECTURAL RENDERERS
// =============================================================================

function drawProceduralCutawayBuilding(ctx, width, height, numFloors, rooms, selectedFloor) {
  // Ground Foundation & Terrain
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(40, 40, width - 80, height - 80);

  // Structural Building Exterior Perimeter Walls
  ctx.strokeStyle = '#1E3A5F';
  ctx.lineWidth = 5;
  ctx.strokeRect(40, 40, width - 80, height - 80);

  // Inner concrete wall outline
  ctx.strokeStyle = '#0E2A47';
  ctx.lineWidth = 2;
  ctx.strokeRect(48, 48, width - 96, height - 96);

  // Concrete Slabs & Column Reinforcements
  ctx.fillStyle = '#1E293B';
  for (let x = 60; x < width - 60; x += 140) {
    ctx.fillRect(x - 5, 40, 10, height - 80);
  }
}

function drawCADBlueprintFloorplan(ctx, width, height, rooms, selectedFloor, obstacles) {
  // 1. Grid Background
  ctx.strokeStyle = 'rgba(14, 42, 71, 0.5)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 2. Heavy Exterior Concrete Perimeter Walls (Double-line CAD style)
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 40, width - 80, height - 80);
  ctx.strokeStyle = '#0284C7';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(46, 46, width - 92, height - 92);

  // Exterior Entrance Doorway with Ramp
  ctx.fillStyle = '#060A14';
  ctx.fillRect(width / 2 - 40, height - 42, 80, 8);
  ctx.strokeStyle = '#38BDF8';
  ctx.strokeRect(width / 2 - 40, height - 42, 80, 8);
  ctx.fillStyle = '#38BDF8';
  ctx.font = 'bold 8px JetBrains Mono, monospace';
  ctx.fillText('▼ GROUND EMERGENCY ENTRANCE', width / 2 - 62, height - 26);

  // 3. Central Corridor Backbone
  ctx.fillStyle = 'rgba(56, 189, 248, 0.04)';
  ctx.fillRect(50, height / 2 - 25, width - 100, 50);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
  ctx.setLineDash([6, 6]);
  ctx.strokeRect(50, height / 2 - 25, width - 100, 50);
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
  ctx.font = '8px JetBrains Mono, monospace';
  ctx.fillText('◀ MAIN CENTRAL ACCESS CORRIDOR ▶', width / 2 - 80, height / 2 + 3);

  // 4. Concrete Rooms with Doors and Swing Arcs
  rooms.forEach((room) => {
    if (selectedFloor !== 'ALL' && room.floor !== Number(selectedFloor)) return;
    const { x, y, w, h, id, name, floor } = room;

    // Room Floor Plate
    ctx.fillStyle = floor === 1 ? 'rgba(6, 182, 212, 0.07)' : floor === 2 ? 'rgba(16, 185, 129, 0.07)' : 'rgba(139, 92, 246, 0.07)';
    ctx.fillRect(x, y, w, h);

    // Concrete Walls
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x, y, w, h);

    // Architectural Doorway with 90° Swing Arc
    const doorX = x + 16;
    const doorY = y + h;
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(doorX, doorY, 14, Math.PI, Math.PI * 1.5);
    ctx.stroke();

    // Corner Structural Columns
    ctx.fillStyle = '#38BDF8';
    [
      [x, y],
      [x + w, y],
      [x, y + h],
      [x + w, y + h]
    ].forEach(([cx, cy]) => {
      ctx.fillRect(cx - 3, cy - 3, 6, 6);
    });

    // Room Tag
    ctx.font = 'bold 8.5px JetBrains Mono, monospace';
    ctx.fillStyle = '#E2E8F0';
    ctx.fillText(`${id} • ${name.toUpperCase()}`, x + 8, y + 16);
    ctx.font = '7.5px JetBrains Mono, monospace';
    ctx.fillStyle = '#64748B';
    ctx.fillText(`[LEVEL ${floor}]`, x + 8, y + 27);
  });

  // 5. Collapsed Structural Rubble
  if (obstacles) {
    obstacles.forEach((obs) => {
      ctx.fillStyle = '#1E293B';
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 1.5;
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);

      ctx.fillStyle = '#FBBF24';
      ctx.font = 'bold 8px JetBrains Mono, monospace';
      ctx.fillText(`⊘ ${obs.id}`, obs.x + 4, obs.y + 12);
    });
  }
}

function drawArchitecturalRoomOverlays(ctx, rooms, selectedFloor, isCutaway) {
  rooms.forEach((room) => {
    if (selectedFloor !== 'ALL' && room.floor !== Number(selectedFloor)) return;

    const { x, y, w, h, id, name, floor, type } = room;

    // Room Bounding Box with subtle tactical glass tint
    ctx.fillStyle = 'rgba(6, 182, 212, 0.06)';
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = room.floor === 1 ? '#06B6D4' : room.floor === 2 ? '#10B981' : '#A78BFA';
    ctx.lineWidth = 1.6;
    ctx.strokeRect(x, y, w, h);

    // Header Badge
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(x, y, Math.min(w, 175), 18);
    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 8px JetBrains Mono, monospace';
    ctx.fillText(`${id} • ${name.toUpperCase()}`, x + 6, y + 12);

    // Elevator / Shaft Highlight
    if (type === 'SHAFT') {
      ctx.strokeStyle = '#EC4899';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
      ctx.setLineDash([]);
      ctx.fillStyle = '#F472B6';
      ctx.font = 'bold 7.5px JetBrains Mono, monospace';
      ctx.fillText('▲ VERTICAL SHAFT CORE ▼', x + 8, y + 28);
    }
  });
}

function drawVerticalElevationView(ctx, width, height, numFloors, env, drones, anims, selectedFloor) {
  // Ground Terrain Foundation
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(50, 50, width - 100, height - 90);

  // Exterior Building Outline
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 4;
  ctx.strokeRect(50, 50, width - 100, height - 90);

  // Roof Helipad & Comms Mast Structure
  ctx.fillStyle = '#0284C7';
  ctx.fillRect(width / 2 - 80, 24, 160, 26);
  ctx.strokeStyle = '#38BDF8';
  ctx.strokeRect(width / 2 - 80, 24, 160, 26);

  // Helipad [ H ]
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(width / 2, 37, 9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 9px JetBrains Mono, monospace';
  ctx.fillText('H', width / 2 - 3.5, 40.5);

  // Flashing Comms Antenna Mast
  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 120, 50);
  ctx.lineTo(width / 2 - 120, 10);
  ctx.stroke();
  ctx.fillStyle = '#EF4444';
  ctx.beginPath();
  ctx.arc(width / 2 - 120, 10, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Draw Vertical Floors and Slabs
  const floorHeight = (height - 110) / numFloors;

  for (let f = 0; f < numFloors; f++) {
    const floorNum = numFloors - f; // Top to bottom
    const floorY = 50 + f * floorHeight;

    // Floor Slab (Reinforced Concrete 12px thick)
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(50, floorY + floorHeight - 12, width - 100, 12);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(50, floorY + floorHeight - 12, width - 100, 12);

    // Floor Name Badge
    ctx.fillStyle = '#38BDF8';
    ctx.font = 'bold 9.5px JetBrains Mono, monospace';
    ctx.fillText(`LEVEL ${floorNum} • FL SLAB ${floorNum * 6}m`, 65, floorY + 22);

    // Vertical Columns
    for (let c = 120; c < width - 100; c += 140) {
      ctx.fillStyle = '#0F2338';
      ctx.fillRect(c, floorY, 14, floorHeight - 12);
      ctx.strokeStyle = '#1E3A5F';
      ctx.strokeRect(c, floorY, 14, floorHeight - 12);
    }
  }

  // Central Vertical Elevator Shaft Traversing All Floors
  const shaftX = width / 2 - 35;
  const shaftW = 70;
  ctx.fillStyle = 'rgba(236, 72, 153, 0.08)';
  ctx.fillRect(shaftX, 50, shaftW, height - 102);
  ctx.strokeStyle = '#EC4899';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(shaftX, 50, shaftW, height - 102);
  ctx.setLineDash([]);

  // Steel Elevator Cables
  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(shaftX + 20, 50);
  ctx.lineTo(shaftX + 20, height - 52);
  ctx.moveTo(shaftX + 50, 50);
  ctx.lineTo(shaftX + 50, height - 52);
  ctx.stroke();

  ctx.fillStyle = '#F472B6';
  ctx.font = 'bold 8px JetBrains Mono, monospace';
  ctx.fillText('ELEVATOR CORE', shaftX + 4, 68);

  // Victims on Floor Levels
  if (env?.victims) {
    env.victims.forEach((v, vIdx) => {
      const f = v.floor || 1;
      const vy = 50 + (numFloors - f) * floorHeight + floorHeight - 24;
      const vx = 100 + (vIdx * 55) % (width - 240);

      ctx.fillStyle = v.detected ? '#10B981' : '#EF4444';
      ctx.beginPath();
      ctx.arc(vx, vy, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#E2E8F0';
      ctx.font = 'bold 7.5px JetBrains Mono, monospace';
      ctx.fillText(`👤 SURVIVOR #${vIdx + 1} (L${f})`, vx + 8, vy + 3);
    });
  }

  // Drones Navigating Vertical Floors
  drones.forEach((d, idx) => {
    const f = d.floor || 1;
    const droneColor = d.assigned_color || d.assignedColor || DRONE_PALETTE[idx % DRONE_PALETTE.length];
    const dy = 50 + (numFloors - f) * floorHeight + 35 + ((idx % 3) * 15);
    const dx = 120 + ((d.x / 800) * (width - 260));

    ctx.save();
    ctx.translate(dx, dy);

    // Quadrotor Icon
    ctx.strokeStyle = droneColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, -8);
    ctx.lineTo(8, 8);
    ctx.moveTo(-8, 8);
    ctx.lineTo(8, -8);
    ctx.stroke();

    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 8px JetBrains Mono, monospace';
    ctx.fillText(`${d.drone_id} [Z=${Math.round(d.z || 12)}m]`, 12, 3);
    ctx.restore();
  });
}
