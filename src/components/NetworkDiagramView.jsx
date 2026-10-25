import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Maximize2, Minimize2, ZoomIn, ZoomOut, RefreshCw, Sparkles, Plus, Code2 } from 'lucide-react';

export default function NetworkDiagramView({
  subject,
  snippets,
  onSelectSnippet,
  onAddNewSnippet
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [hoveredNode, setHoveredNode] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Physics simulation state stored in refs to avoid re-triggering render loops
  const stateRef = useRef({
    nodes: [],
    links: [],
    particles: [],
    transform: { x: 0, y: 0, k: 1 },
    dragNode: null,
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    lastTouchDistance: null,
    touchStartTime: 0,
    hasMoved: false,
    width: 0,
    height: 0
  });

  // Initialize or update nodes and links whenever snippets or subject change
  useEffect(() => {
    const s = stateRef.current;
    const width = s.width || 600;
    const height = s.height || 500;

    // Central Core Node (The Subject)
    const centerNode = {
      id: 'center-core',
      isCenter: true,
      label: subject.name,
      sublabel: `${snippets.length} Topics`,
      x: width / 2,
      y: height / 2,
      vx: 0,
      vy: 0,
      radius: 46,
      color: subject.color || '#38bdf8'
    };

    // Snippet Nodes (The Code Orbs)
    const count = snippets.length;
    const snippetNodes = snippets.map((snip, index) => {
      // Find existing position if preserved
      const existing = s.nodes.find(n => n.id === snip.id);
      const angle = (index / (count || 1)) * 2 * Math.PI;
      const initialDist = 130 + (index % 2) * 55;

      return {
        id: snip.id,
        isCenter: false,
        snippet: snip,
        serialNumber: snip.serialNumber || (index + 1),
        label: snip.title,
        language: snip.language || 'code',
        x: existing ? existing.x : width / 2 + Math.cos(angle) * initialDist,
        y: existing ? existing.y : height / 2 + Math.sin(angle) * initialDist,
        vx: 0,
        vy: 0,
        radius: 30,
        color: subject.color || '#38bdf8'
      };
    });

    s.nodes = [centerNode, ...snippetNodes];

    // Links between center and all snippets + subtle sibling links
    const links = snippetNodes.map(node => ({
      source: centerNode,
      target: node,
      distance: 140,
      strength: 0.05
    }));

    // Optional ring connection between sequential snippets
    for (let i = 0; i < snippetNodes.length - 1; i++) {
      links.push({
        source: snippetNodes[i],
        target: snippetNodes[i + 1],
        distance: 110,
        strength: 0.02,
        isRing: true
      });
    }

    s.links = links;

    // Ambient floating cosmic dust
    if (s.particles.length === 0) {
      const particles = [];
      for (let i = 0; i < 40; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 2 + 0.5,
          alpha: Math.random() * 0.6 + 0.2,
          speed: Math.random() * 0.3 + 0.1
        });
      }
      s.particles = particles;
    }
  }, [subject, snippets]);

  // Main Canvas Render & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Resize observer to handle dynamic orientation changes on phones
    const updateDimensions = () => {
      if (!containerRef.current || !canvas) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(rect.width, 320);
      const h = Math.max(rect.height, 400);

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);

      stateRef.current.width = w;
      stateRef.current.height = h;

      // Adjust center node if freshly mounted
      const center = stateRef.current.nodes.find(n => n.isCenter);
      if (center && (!center.x || center.x === 300)) {
        center.x = w / 2;
        center.y = h / 2;
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    let pulseTime = 0;

    const render = () => {
      pulseTime += 0.03;
      const s = stateRef.current;
      const w = s.width;
      const h = s.height;
      const t = s.transform;

      ctx.save();
      ctx.clearRect(0, 0, w, h);

      // Canvas background gradient
      const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, Math.max(w, h));
      bgGrad.addColorStop(0, 'rgba(17, 24, 39, 0.4)');
      bgGrad.addColorStop(1, 'rgba(9, 13, 22, 0.9)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Draw subtle grid dots
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      const gridSize = 32;
      for (let gx = 0; gx < w; gx += gridSize) {
        for (let gy = 0; gy < h; gy += gridSize) {
          ctx.beginPath();
          ctx.arc(gx, gy, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // Ambient moving cosmic particles
      ctx.save();
      s.particles.forEach(p => {
        p.y -= p.speed;
        if (p.y < 0) p.y = h;
        ctx.fillStyle = `rgba(147, 197, 253, ${p.alpha * 0.4})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      // Apply zoom & pan transformation
      ctx.translate(t.x, t.y);
      ctx.scale(t.k, t.k);

      // --- Physics Simulation Step ---
      const nodes = s.nodes;
      const links = s.links;

      // Center force for center node
      const centerNode = nodes.find(n => n.isCenter);
      if (centerNode && s.dragNode !== centerNode) {
        centerNode.x += (w / 2 - centerNode.x) * 0.05;
        centerNode.y += (h / 2 - centerNode.y) * 0.05;
      }

      // Repulsion between all nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dy + dy * dy) || 1;
          const minDist = a.radius + b.radius + 40;

          if (dist < minDist) {
            const force = ((minDist - dist) / dist) * 0.15;
            if (s.dragNode !== a && !a.isCenter) {
              a.x -= dx * force;
              a.y -= dy * force;
            }
            if (s.dragNode !== b && !b.isCenter) {
              b.x += dx * force;
              b.y += dy * force;
            }
          }
        }
      }

      // Link attraction forces
      links.forEach(link => {
        const a = link.source;
        const b = link.target;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const desired = link.distance;
        const diff = (dist - desired) / dist;
        const force = diff * link.strength;

        if (s.dragNode !== a && !a.isCenter) {
          a.x += dx * force * 0.5;
          a.y += dy * force * 0.5;
        }
        if (s.dragNode !== b && !b.isCenter) {
          b.x -= dx * force * 0.5;
          b.y -= dy * force * 0.5;
        }
      });

      // Keep nodes comfortably inside viewing bounds
      nodes.forEach(node => {
        if (s.dragNode !== node) {
          const pad = 40;
          if (node.x < pad) node.x += (pad - node.x) * 0.1;
          if (node.x > w - pad) node.x += (w - pad - node.x) * 0.1;
          if (node.y < pad) node.y += (pad - node.y) * 0.1;
          if (node.y > h - pad) node.y += (h - pad - node.y) * 0.1;
        }
      });

      // --- Draw Links / Filaments ---
      links.forEach(link => {
        const a = link.source;
        const b = link.target;

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);

        if (link.isRing) {
          // Subtle dash ring between siblings
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 6]);
        } else {
          // Glowing synaptic beam from center
          ctx.setLineDash([]);
          const linkGrad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
          linkGrad.addColorStop(0, `${subject.color || '#38bdf8'}88`);
          linkGrad.addColorStop(1, 'rgba(99, 102, 241, 0.2)');
          ctx.strokeStyle = linkGrad;
          ctx.lineWidth = 2;
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Small traveling energy particle along each link
        if (!link.isRing) {
          const tPos = ((pulseTime * 0.5 + a.x + b.x) % 10) / 10;
          const px = a.x + (b.x - a.x) * tPos;
          const py = a.y + (b.y - a.y) * tPos;
          ctx.fillStyle = subject.color || '#38bdf8';
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // --- Draw Nodes / Orbs ---
      nodes.forEach(node => {
        const isHovered = hoveredNode && hoveredNode.id === node.id;
        const isDragged = s.dragNode && s.dragNode.id === node.id;

        if (node.isCenter) {
          // Draw Main Subject Hub Orb
          const pulse = Math.sin(pulseTime) * 3;
          const r = node.radius + pulse;

          // Outer pulsing aura
          const aura = ctx.createRadialGradient(node.x, node.y, r * 0.4, node.x, node.y, r * 2.2);
          aura.addColorStop(0, `${node.color}55`);
          aura.addColorStop(0.7, `${node.color}15`);
          aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = aura;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r * 2.2, 0, Math.PI * 2);
          ctx.fill();

          // Core Sphere
          const coreGrad = ctx.createRadialGradient(
            node.x - r * 0.3,
            node.y - r * 0.3,
            r * 0.1,
            node.x,
            node.y,
            r
          );
          coreGrad.addColorStop(0, '#ffffff');
          coreGrad.addColorStop(0.3, node.color);
          coreGrad.addColorStop(1, '#0f172a');

          ctx.fillStyle = coreGrad;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
          ctx.fill();

          // Border ring
          ctx.strokeStyle = '#ffffffaa';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Center Label Text
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 15px Outfit, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(node.label, node.x, node.y - 6);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.font = '500 11px Outfit, sans-serif';
          ctx.fillText(node.sublabel, node.x, node.y + 12);

        } else {
          // Draw Snippet Code Orb
          const r = isHovered || isDragged ? node.radius + 4 : node.radius;

          // Outer Glow
          const orbGlow = ctx.createRadialGradient(node.x, node.y, r * 0.3, node.x, node.y, r * 1.8);
          orbGlow.addColorStop(0, `${node.color}66`);
          orbGlow.addColorStop(0.8, `${node.color}11`);
          orbGlow.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = orbGlow;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r * 1.8, 0, Math.PI * 2);
          ctx.fill();

          // Orb body gradient
          const orbGrad = ctx.createRadialGradient(
            node.x - r * 0.3,
            node.y - r * 0.3,
            r * 0.1,
            node.x,
            node.y,
            r
          );
          orbGrad.addColorStop(0, '#ffffff');
          orbGrad.addColorStop(0.35, node.color);
          orbGrad.addColorStop(0.9, '#1e1b4b');
          orbGrad.addColorStop(1, '#090d16');

          ctx.fillStyle = orbGrad;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
          ctx.fill();

          // Orb Rim
          ctx.strokeStyle = isHovered ? '#38bdf8' : 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = isHovered ? 2.5 : 1.5;
          ctx.stroke();

          // Serial Number Badge inside the Orb
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 13px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`#${node.serialNumber}`, node.x, node.y);

          // Language dot on orb top-right
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.arc(node.x + r * 0.65, node.y - r * 0.65, 4, 0, Math.PI * 2);
          ctx.fill();

          // Title Label Below Orb
          const title = node.label.length > 18 ? node.label.slice(0, 16) + '...' : node.label;
          ctx.font = '600 12px Outfit, sans-serif';
          const textWidth = ctx.measureText(title).width;
          const badgePadX = 8;
          const badgePadY = 4;
          const labelY = node.y + r + 14;

          // Pill background for title
          ctx.fillStyle = isHovered ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.85)';
          ctx.strokeStyle = isHovered ? `${node.color}cc` : 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 1;

          const pillX = node.x - textWidth / 2 - badgePadX;
          const pillY = labelY - 10;
          const pillW = textWidth + badgePadX * 2;
          const pillH = 20;
          const pillR = 10;

          ctx.beginPath();
          ctx.roundRect(pillX, pillY, pillW, pillH, pillR);
          ctx.fill();
          ctx.stroke();

          // Title text
          ctx.fillStyle = isHovered ? '#ffffff' : '#e2e8f0';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(title, node.x, labelY);
        }
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', updateDimensions);
    };
  }, [subject, hoveredNode]);

  // Screen to Canvas Coordinates converter
  const getCanvasCoords = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const s = stateRef.current;
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;

    // Apply inverse transform
    const x = (screenX - s.transform.x) / s.transform.k;
    const y = (screenY - s.transform.y) / s.transform.k;
    return { x, y, screenX, screenY };
  }, []);

  // Find node under pointer
  const findNodeAt = useCallback((x, y) => {
    const s = stateRef.current;
    for (let i = s.nodes.length - 1; i >= 0; i--) {
      const node = s.nodes[i];
      const dx = node.x - x;
      const dy = node.y - y;
      const hitRadius = node.radius + 15; // Generous tap target for mobile thumbs
      if (dx * dx + dy * dy <= hitRadius * hitRadius) {
        return node;
      }
    }
    return null;
  }, []);

  // Pointer / Mouse / Touch Handlers
  const handlePointerDown = (e) => {
    const s = stateRef.current;
    const { x, y, screenX, screenY } = getCanvasCoords(e.clientX, e.clientY);
    s.hasMoved = false;
    s.touchStartTime = Date.now();

    const clickedNode = findNodeAt(x, y);

    if (clickedNode) {
      s.dragNode = clickedNode;
      s.isDragging = true;
      s.dragStart = { x: screenX, y: screenY };
    } else {
      // Pan canvas
      s.isDragging = true;
      s.dragStart = { x: screenX - s.transform.x, y: screenY - s.transform.y };
    }
  };

  const handlePointerMove = (e) => {
    const s = stateRef.current;
    const { x, y, screenX, screenY } = getCanvasCoords(e.clientX, e.clientY);

    // Hover state detection
    const node = findNodeAt(x, y);
    if (node && !node.isCenter) {
      setHoveredNode(node);
    } else {
      setHoveredNode(null);
    }

    if (!s.isDragging) return;

    const moveDist = Math.hypot(screenX - (s.dragStart.x + (s.dragNode ? 0 : s.transform.x)), screenY - (s.dragStart.y + (s.dragNode ? 0 : s.transform.y)));
    if (moveDist > 5) {
      s.hasMoved = true;
    }

    if (s.dragNode) {
      // Move dragged node
      s.dragNode.x = x;
      s.dragNode.y = y;
    } else {
      // Pan whole canvas
      s.transform.x = screenX - s.dragStart.x;
      s.transform.y = screenY - s.dragStart.y;
    }
  };

  const handlePointerUp = (e) => {
    const s = stateRef.current;
    const clickDuration = Date.now() - s.touchStartTime;

    // Check if this was a click/tap rather than a pan/drag
    if (!s.hasMoved && clickDuration < 450) {
      const { x, y } = getCanvasCoords(e.clientX, e.clientY);
      const clickedNode = findNodeAt(x, y);

      if (clickedNode) {
        if (!clickedNode.isCenter && clickedNode.snippet) {
          // USER REQUIREMENT: "in one click of orb I get into the code page which I pasted..... have full access"
          onSelectSnippet(clickedNode.snippet);
        } else if (clickedNode.isCenter) {
          // Tapping center resets view
          resetTransform();
        }
      }
    }

    s.isDragging = false;
    s.dragNode = null;
    s.hasMoved = false;
  };

  // Touch zoom gesture support (pinch-to-zoom on phone)
  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      const s = stateRef.current;

      if (s.lastTouchDistance) {
        const delta = dist / s.lastTouchDistance;
        const newZoom = Math.min(Math.max(s.transform.k * delta, 0.5), 2.5);
        s.transform.k = newZoom;
        setZoomLevel(newZoom);
      }
      s.lastTouchDistance = dist;
    }
  };

  const handleTouchEnd = () => {
    stateRef.current.lastTouchDistance = null;
  };

  // Zoom buttons
  const zoomIn = () => {
    const s = stateRef.current;
    const newZoom = Math.min(s.transform.k * 1.25, 2.5);
    s.transform.k = newZoom;
    setZoomLevel(newZoom);
  };

  const zoomOut = () => {
    const s = stateRef.current;
    const newZoom = Math.max(s.transform.k / 1.25, 0.5);
    s.transform.k = newZoom;
    setZoomLevel(newZoom);
  };

  const resetTransform = () => {
    const s = stateRef.current;
    s.transform = { x: 0, y: 0, k: 1 };
    setZoomLevel(1);
  };

  return (
    <div
      ref={containerRef}
      className={`network-diagram-container ${isFullscreen ? 'fullscreen-mode' : ''}`}
      style={{
        position: 'relative',
        width: '100%',
        height: isFullscreen ? '100vh' : 'calc(100vh - 210px)',
        minHeight: '440px',
        overflow: 'hidden',
        borderRadius: isFullscreen ? '0' : '20px',
        background: '#0a0e1a',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        touchAction: 'none'
      }}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          cursor: hoveredNode ? 'pointer' : 'grab'
        }}
      />

      {/* Top Floating Info / Quick Helper HUD */}
      <div
        style={{
          position: 'absolute',
          top: '14px',
          left: '14px',
          right: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none',
          zIndex: 10
        }}
      >
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '999px',
            padding: '6px 14px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: '#e2e8f0',
            fontWeight: 500,
            pointerEvents: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: subject.color || '#38bdf8',
              boxShadow: `0 0 10px ${subject.color || '#38bdf8'}`
            }}
          />
          <span>Interactive Neural Orb Diagram</span>
          <span style={{ opacity: 0.5 }}>•</span>
          <span style={{ color: '#94a3b8' }}>Tap orb for full code</span>
        </div>
      </div>

      {/* Empty State Prompt if no snippets */}
      {snippets.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            padding: '24px',
            maxWidth: '320px',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(16px)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            zIndex: 15
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: `${subject.color || '#38bdf8'}22`,
              color: subject.color || '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px auto',
              border: `1px solid ${subject.color || '#38bdf8'}44`
            }}
          >
            <Sparkles size={28} />
          </div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#f8fafc' }}>
            No Code Orbs Yet
          </h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
            Store your first {subject.name} algorithm or code snippet to start orbiting this network.
          </p>
          <button
            onClick={onAddNewSnippet}
            style={{
              width: '100%',
              padding: '12px 18px',
              background: `linear-gradient(135deg, ${subject.color || '#38bdf8'}, #6366f1)`,
              border: 'none',
              borderRadius: '12px',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0,0,0,0.3)'
            }}
          >
            <Plus size={18} />
            Add First Code Snippet
          </button>
        </div>
      )}

      {/* Floating Canvas Controls (Mobile-Friendly Pill) */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 10
        }}
      >
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '14px',
            padding: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
          }}
        >
          <button
            onClick={zoomIn}
            title="Zoom In"
            aria-label="Zoom In"
            style={{
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              borderRadius: '10px',
              color: '#e2e8f0',
              cursor: 'pointer'
            }}
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={zoomOut}
            title="Zoom Out"
            aria-label="Zoom Out"
            style={{
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              borderRadius: '10px',
              color: '#e2e8f0',
              cursor: 'pointer'
            }}
          >
            <ZoomOut size={18} />
          </button>
          <button
            onClick={resetTransform}
            title="Recenter View"
            aria-label="Recenter View"
            style={{
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              borderRadius: '10px',
              color: '#e2e8f0',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={17} />
          </button>
        </div>
      </div>

      {/* Floating Add Snippet Button inside Canvas HUD */}
      {snippets.length > 0 && (
        <button
          onClick={onAddNewSnippet}
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            background: `linear-gradient(135deg, ${subject.color || '#38bdf8'}, #6366f1)`,
            border: 'none',
            borderRadius: '999px',
            padding: '10px 18px',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: `0 4px 18px ${subject.color || '#38bdf8'}66`,
            zIndex: 10
          }}
        >
          <Plus size={16} />
          <span>Add Code Orb</span>
        </button>
      )}

      {/* Hover preview tooltip */}
      {hoveredNode && (
        <div
          style={{
            position: 'absolute',
            bottom: '68px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(16px)',
            border: `1px solid ${subject.color || '#38bdf8'}66`,
            borderRadius: '12px',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#f8fafc',
            fontSize: '12px',
            pointerEvents: 'none',
            zIndex: 20,
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)'
          }}
        >
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '6px',
              background: `${subject.color || '#38bdf8'}22`,
              color: subject.color || '#38bdf8',
              fontWeight: 700,
              fontFamily: '"JetBrains Mono", monospace'
            }}
          >
            #{hoveredNode.serialNumber}
          </span>
          <span style={{ fontWeight: 600 }}>{hoveredNode.label}</span>
          <span style={{ color: '#38bdf8', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Code2 size={12} /> Tap to Open
          </span>
        </div>
      )}
    </div>
  );
}
