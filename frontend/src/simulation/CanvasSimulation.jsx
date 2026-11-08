import React, { useRef, useEffect } from 'react';

export const CanvasSimulation = ({
  simState,
  selectedDroneId,
  onSelectDrone,
  showCoverage = true,
  showCommLinks = true,
  showSmoke = true
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 800;
    const height = 600;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // 1. Clear background
    ctx.fillStyle = '#F5F0E6'; // Disaster terrain base color
    ctx.fillRect(0, 0, width, height);

    // Draw subtle terrain grid lines
    ctx.strokeStyle = '#E5DEC9';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const env = simState?.environment;

    // 2. Search Coverage Heatmap Overlay
    if (showCoverage && simState?.coverage_percent !== undefined) {
      // Draw simulated light green scanned overlay
      // For performance and visual cleanliness, draw subtle circular radar trails behind drones
      const drones = simState?.drones || [];
      drones.forEach((d) => {
        const radGrad = ctx.createRadialGradient(d.x, d.y, 5, d.x, d.y, 70);
        radGrad.addColorStop(0, 'rgba(61, 122, 90, 0.22)');
        radGrad.addColorStop(1, 'rgba(61, 122, 90, 0.0)');
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(d.x, d.y, 70, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 3. Obstacles (Collapsed Buildings & Rubble)
    if (env?.obstacles) {
      env.obstacles.forEach((obs) => {
        ctx.fillStyle = '#D6CCBA';
        ctx.strokeStyle = '#B8AA94';
        ctx.lineWidth = 2;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);

        // Debris cross-hatching
        ctx.strokeStyle = 'rgba(120, 113, 108, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y);
        ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
        ctx.moveTo(obs.x + obs.width, obs.y);
        ctx.lineTo(obs.x, obs.y + obs.height);
        ctx.stroke();

        // Label
        ctx.fillStyle = '#57534E';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillText(obs.id, obs.x + 6, obs.y + 14);
      });
    }

    // 4. Smoke Plumes
    if (showSmoke && env?.smoke_zones) {
      env.smoke_zones.forEach((sm) => {
        const radGrad = ctx.createRadialGradient(sm.x, sm.y, 10, sm.x, sm.y, sm.radius);
        radGrad.addColorStop(0, 'rgba(100, 95, 90, 0.65)');
        radGrad.addColorStop(0.6, 'rgba(130, 120, 110, 0.35)');
        radGrad.addColorStop(1, 'rgba(160, 150, 140, 0.0)');
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(sm.x, sm.y, sm.radius, 0, Math.PI * 2);
        ctx.fill();

        // Smoke center label
        ctx.fillStyle = 'rgba(40, 35, 30, 0.7)';
        ctx.font = '9px Inter, sans-serif';
        ctx.fillText(`Smoke ${Math.round(sm.density * 100)}%`, sm.x - 24, sm.y);
      });
    }

    // 5. Active Mission Task Markers
    const tasks = simState?.tasks || [];
    tasks.forEach((tsk) => {
      const loc = tsk.location;
      if (!loc) return;
      ctx.fillStyle = tsk.taskStatus === 'IN_PROGRESS' ? '#C85A32' : '#D97706';
      ctx.beginPath();
      ctx.arc(loc.x, loc.y, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = '9px JetBrains Mono, monospace';
      ctx.fillStyle = '#292524';
      ctx.fillText(`${tsk.taskId} (${tsk.taskType[0]})`, loc.x + 9, loc.y + 3);
    });

    // 6. Victims (Surviving trapped casualties)
    if (env?.victims) {
      env.victims.forEach((v) => {
        ctx.save();
        if (v.detected) {
          // Detected: Sage Green beacon
          ctx.fillStyle = '#3D7A5A';
          ctx.strokeStyle = '#EBF4EE';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(v.x, v.y, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.font = '9px Inter, sans-serif';
          ctx.fillStyle = '#32664A';
          ctx.fillText(`✓ Found by ${v.detected_by || 'UAV'}`, v.x + 9, v.y + 3);
        } else {
          // Trapped & Unfound: Pulsing Red beacon
          ctx.fillStyle = '#C53030';
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(v.x, v.y, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.font = '8px Inter, sans-serif';
          ctx.fillStyle = '#991B1B';
          ctx.fillText(`SOS`, v.x + 8, v.y + 3);
        }
        ctx.restore();
      });
    }

    // 7. P2P Communication Mesh Links (Stage 6)
    const topology = simState?.topology;
    if (showCommLinks && topology?.edges && topology?.nodes) {
      const nodePos = {};
      topology.nodes.forEach((n) => {
        nodePos[n.id] = { x: n.x, y: n.y };
      });

      topology.edges.forEach((edge) => {
        const p1 = nodePos[edge.source];
        const p2 = nodePos[edge.target];
        if (p1 && p2) {
          ctx.save();
          ctx.setLineDash([4, 4]);
          // Link color based on packet loss
          const loss = edge.loss_prob || 0.05;
          if (loss > 0.3) {
            ctx.strokeStyle = 'rgba(217, 119, 6, 0.7)'; // degraded link
            ctx.lineWidth = 1.2;
          } else {
            ctx.strokeStyle = 'rgba(61, 122, 90, 0.65)'; // strong link
            ctx.lineWidth = 1.5;
          }
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
          ctx.restore();
        }
      });
    }

    // 8. UAV Drones
    const drones = simState?.drones || [];
    drones.forEach((drone) => {
      const isSelected = drone.drone_id === selectedDroneId;
      const status = drone.operational_status || drone.operationalStatus || 'HEALTHY';

      // Colors based on operational status
      let droneColor = '#3D7A5A'; // Sage green (Healthy)
      if (status === 'DEGRADED') droneColor = '#D97706'; // Amber (Degraded)
      if (status === 'CRITICAL') droneColor = '#C53030'; // Muted red (Critical)
      if (drone.current_role === 'Return to Home / Land') droneColor = '#78716C'; // Grey (RTL)

      ctx.save();
      ctx.translate(drone.x, drone.y);

      // Selected ring
      if (isSelected) {
        ctx.strokeStyle = '#C85A32';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Drone Sensor FOV / Comm footprint
      ctx.strokeStyle = 'rgba(120, 113, 108, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, 35, 0, Math.PI * 2);
      ctx.stroke();

      // Drone Quadrotor Body
      ctx.fillStyle = droneColor;
      ctx.strokeStyle = '#1C1917';
      ctx.lineWidth = 1.5;

      // Draw Quadrotor cross
      ctx.beginPath();
      ctx.moveTo(-10, -10);
      ctx.lineTo(10, 10);
      ctx.moveTo(-10, 10);
      ctx.lineTo(10, -10);
      ctx.stroke();

      // Rotor hubs
      [-10, 10].forEach((rx) => {
        [-10, 10].forEach((ry) => {
          ctx.fillStyle = '#292524';
          ctx.beginPath();
          ctx.arc(rx, ry, 3.5, 0, Math.PI * 2);
          ctx.fill();
        });
      });

      // Center Fuselage
      ctx.fillStyle = droneColor;
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Directional Nose Indicator
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(0, -4, 2, 0, Math.PI * 2);
      ctx.fill();

      // Drone ID & Role Label
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.fillStyle = '#1C1917';
      ctx.fillText(drone.drone_id, 14, -4);

      // Role pill below drone
      const roleAbbr = {
        'Search and exploration': 'SEARCH',
        'Victim detection': 'VICTIM',
        'Mapping and reconnaissance': 'MAP',
        'Communication relay': 'RELAY',
        'Return to Home / Land': 'RTL'
      }[drone.current_role] || 'ROLE';

      ctx.font = '8px Inter, sans-serif';
      ctx.fillStyle = '#57534E';
      ctx.fillText(`${roleAbbr} • ${Math.round(drone.battery)}%`, 14, 8);

      ctx.restore();
    });
  }, [simState, selectedDroneId, showCoverage, showCommLinks, showSmoke]);

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
      const dist = Math.hypot(clickX - d.x, clickY - d.y);
      if (dist <= 25) {
        onSelectDrone(d.drone_id);
        return;
      }
    }
  };

  return (
    <div className="relative border border-cream-300 rounded-2xl overflow-hidden bg-white shadow-sm flex items-center justify-center">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{ width: '100%', height: 'auto', aspectRatio: '800 / 600' }}
        className="cursor-crosshair block"
      />
    </div>
  );
};
