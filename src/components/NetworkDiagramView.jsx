import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Sparkles,
  Plus,
  Code2,
  Layers,
  Search,
  Maximize2,
  Minimize2,
  Filter
} from 'lucide-react';

export default function NetworkDiagramView({
  subject,
  snippets,
  allSubjects = [],
  allSnippets = [],
  onSelectSnippet,
  onAddNewSnippet
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Graph mode: 'global' (All subjects + snippets like Obsidian) or 'subject' (only current subject)
  const [graphMode, setGraphMode] = useState('global');
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [stats, setStats] = useState({ nodes: 0, links: 0 });

  // Physics simulation state held in ref to maintain 60fps smooth rendering
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
    width: 800,
    height: 600,
    animating: true
  });

  // Re-build nodes and links when subjects, snippets, or graphMode change
  useEffect(() => {
    const s = stateRef.current;
    const w = s.width || 800;
    const h = s.height || 600;

    let targetSubjects = [];
    let targetSnippets = [];

    if (graphMode === 'global') {
      // Obsidian Global Vault Graph Mode: All subjects and all snippets
      targetSubjects = allSubjects.length ? allSubjects : [subject];
      targetSnippets = allSnippets.length ? allSnippets : snippets;
    } else {
      // Focused Single Subject Graph Mode
      targetSubjects = [subject];
      targetSnippets = snippets;
    }

    const newNodes = [];
    const newLinks = [];

    // 1. Create Subject Hub Nodes
    const subjectNodeMap = new Map();
    const subCount = targetSubjects.length;

    targetSubjects.forEach((sub, i) => {
      const existing = s.nodes.find(n => n.id === `sub-${sub.id}`);
      const angle = (i / (subCount || 1)) * 2 * Math.PI;
      const dist = subCount > 1 ? Math.min(w, h) * 0.28 : 0;

      const subNode = {
        id: `sub-${sub.id}`,
        isHub: true,
        subjectId: sub.id,
        label: sub.name,
        color: sub.color || '#38bdf8',
        radius: subCount > 1 ? 26 : 34,
        x: existing ? existing.x : w / 2 + Math.cos(angle) * dist,
        y: existing ? existing.y : h / 2 + Math.sin(angle) * dist,
        vx: 0,
        vy: 0
      };

      subjectNodeMap.set(sub.id, subNode);
      newNodes.push(subNode);
    });

    // 2. Connect Subject Hubs together if global view (cross-discipline knowledge link)
    if (targetSubjects.length > 1) {
      for (let i = 0; i < targetSubjects.length; i++) {
        for (let j = i + 1; j < targetSubjects.length; j++) {
          newLinks.push({
            source: subjectNodeMap.get(targetSubjects[i].id),
            target: subjectNodeMap.get(targetSubjects[j].id),
            distance: Math.min(w, h) * 0.45,
            strength: 0.015,
            isInterSubject: true
          });
        }
      }
    }

    // 3. Create Snippet Code Nodes & Link to their respective Subject Hubs
    targetSnippets.forEach((snip, index) => {
      const parentHub = subjectNodeMap.get(snip.subjectId) || subjectNodeMap.get(subject.id);
      const existing = s.nodes.find(n => n.id === snip.id);

      // Distribute snippets radially around their parent subject hub
      const angle = (index * 1.61803398875) * 2 * Math.PI; // Golden ratio spiral distribution
      const hubX = parentHub ? parentHub.x : w / 2;
      const hubY = parentHub ? parentHub.y : h / 2;
      const initialDist = 80 + (index % 4) * 35;

      const snipNode = {
        id: snip.id,
        isHub: false,
        snippet: snip,
        subjectId: snip.subjectId,
        serialNumber: snip.serialNumber || (index + 1),
        label: snip.title,
        language: snip.language || 'code',
        color: parentHub ? parentHub.color : (subject.color || '#38bdf8'),
        radius: 16,
        x: existing ? existing.x : hubX + Math.cos(angle) * initialDist,
        y: existing ? existing.y : hubY + Math.sin(angle) * initialDist,
        vx: 0,
        vy: 0
      };

      newNodes.push(snipNode);

      if (parentHub) {
        newLinks.push({
          source: parentHub,
          target: snipNode,
          distance: 100,
          strength: 0.04
        });
      }
    });

    s.nodes = newNodes;
    s.links = newLinks;
    setStats({ nodes: newNodes.length, links: newLinks.length });

    // Ambient cosmic dust particles
    if (s.particles.length === 0) {
      const parts = [];
      for (let i = 0; i < 50; i++) {
        parts.push({
          x: Math.random() * w,
          y: Math.random() * h,
          size: Math.random() * 1.8 + 0.4,
          alpha: Math.random() * 0.5 + 0.1,
          speed: Math.random() * 0.2 + 0.05
        });
      }
      s.particles = parts;
    }
  }, [subject, snippets, allSubjects, allSnippets, graphMode]);

  // Main Canvas Rendering & Obsidian Physics Simulation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.max(rect.width, 320);
      const h = Math.max(rect.height, 460);
      const dpr = window.devicePixelRatio || 1;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      stateRef.current.width = w;
      stateRef.current.height = h;

      // Scale context for retina screens
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();
    const ro = new ResizeObserver(resizeCanvas);
    ro.observe(container);

    let time = 0;

    const render = () => {
      time += 0.02;
      const s = stateRef.current;
      const w = s.width;
      const h = s.height;
      const t = s.transform;

      ctx.save();
      // Clear screen
      ctx.clearRect(0, 0, w, h);

      // Deep Obsidian Theme Background
      const grad = ctx.createRadialGradient(w / 2, h / 2, 80, w / 2, h / 2, Math.max(w, h));
      grad.addColorStop(0, '#0e1424');
      grad.addColorStop(1, '#080c16');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Subtle coordinate star-dots (Obsidian background graph texture)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      const step = 36;
      for (let x = 0; x < w; x += step) {
        for (let y = 0; y < h; y += step) {
          ctx.beginPath();
          ctx.arc(x, y, 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Ambient moving cosmic dust
      s.particles.forEach(p => {
        p.y -= p.speed;
        if (p.y < 0) p.y = h;
        ctx.fillStyle = `rgba(147, 197, 253, ${p.alpha * 0.4})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Apply Pan & Zoom Transformation
      ctx.translate(t.x, t.y);
      ctx.scale(t.k, t.k);

      // --- OBSIDIAN FORCE PHYSICS SIMULATION ---
      const nodes = s.nodes;
      const links = s.links;

      // 1. Center Gravity: Pull nodes gently toward center of the screen
      const cx = w / 2;
      const cy = h / 2;
      nodes.forEach(node => {
        if (s.dragNode !== node) {
          const dx = cx - node.x;
          const dy = cy - node.y;
          node.vx += dx * 0.0006;
          node.vy += dy * 0.0006;
        }
      });

      // 2. Many-Body Coulomb Repulsion: Nodes push away from each other so they never clump
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distSq = dx * dx + dy * dy || 1;
          const dist = Math.sqrt(distSq);
          const minDist = a.radius + b.radius + 35;

          if (dist < minDist) {
            const overlap = (minDist - dist) / dist;
            const force = overlap * 0.35;
            if (s.dragNode !== a) {
              a.vx -= dx * force;
              a.vy -= dy * force;
            }
            if (s.dragNode !== b) {
              b.vx += dx * force;
              b.vy += dy * force;
            }
          } else if (dist < 260) {
            const repulse = 180 / distSq;
            if (s.dragNode !== a) {
              a.vx -= (dx / dist) * repulse;
              a.vy -= (dy / dist) * repulse;
            }
            if (s.dragNode !== b) {
              b.vx += (dx / dist) * repulse;
              b.vy += (dy / dist) * repulse;
            }
          }
        }
      }

      // 3. Hooke Spring Attraction along Links
      links.forEach(link => {
        const a = link.source;
        const b = link.target;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const diff = (dist - link.distance) / dist;
        const force = diff * link.strength;

        if (s.dragNode !== a) {
          a.vx += dx * force;
          a.vy += dy * force;
        }
        if (s.dragNode !== b) {
          b.vx -= dx * force;
          b.vy -= dy * force;
        }
      });

      // 4. Update Node Positions with Damping (Friction)
      nodes.forEach(node => {
        if (s.dragNode !== node) {
          node.vx *= 0.84; // velocity damping
          node.vy *= 0.84;
          node.x += node.vx;
          node.y += node.vy;

          // Boundary constraints to keep nodes on screen
          const pad = 40;
          if (node.x < pad) { node.x = pad; node.vx = 0; }
          if (node.x > w - pad) { node.x = w - pad; node.vx = 0; }
          if (node.y < pad) { node.y = pad; node.vy = 0; }
          if (node.y > h - pad) { node.y = h - pad; node.vy = 0; }
        }
      });

      // Active focus detection (Obsidian highlight feature)
      const activeHighlightNode = hoveredNode || selectedNode;
      const connectedNodeIds = new Set();
      if (activeHighlightNode) {
        connectedNodeIds.add(activeHighlightNode.id);
        links.forEach(l => {
          if (l.source.id === activeHighlightNode.id) connectedNodeIds.add(l.target.id);
          if (l.target.id === activeHighlightNode.id) connectedNodeIds.add(l.source.id);
        });
      }

      // Filter query matching
      const hasFilter = searchFilter.trim().length > 0;
      const filterLower = searchFilter.toLowerCase();

      // --- DRAW CONNECTING FILAMENTS (LINKS) ---
      links.forEach(link => {
        const a = link.source;
        const b = link.target;

        const isLinkConnected = activeHighlightNode &&
          (connectedNodeIds.has(a.id) && connectedNodeIds.has(b.id));

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);

        if (isLinkConnected) {
          // Highlighted link
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.2;
          ctx.stroke();

          // Traveling energy photon along the filament
          const tPos = ((time * 0.7 + a.x + b.x) % 10) / 10;
          const px = a.x + (b.x - a.x) * tPos;
          const py = a.y + (b.y - a.y) * tPos;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (link.isInterSubject) {
          // Inter-subject dashed connection
          ctx.setLineDash([4, 6]);
          ctx.strokeStyle = activeHighlightNode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          // Normal delicate Obsidian filament
          const alpha = activeHighlightNode ? 0.06 : 0.22;
          ctx.strokeStyle = `rgba(148, 163, 184, ${alpha})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      });

      // --- DRAW NODES / ORBS ---
      nodes.forEach(node => {
        const isHovered = activeHighlightNode && activeHighlightNode.id === node.id;
        const isConnected = activeHighlightNode && connectedNodeIds.has(node.id);
        const matchesFilter = hasFilter && node.label.toLowerCase().includes(filterLower);

        // Opacity dimming if another node is focused
        let nodeAlpha = 1;
        if (activeHighlightNode && !isConnected) {
          nodeAlpha = 0.2;
        }
        if (hasFilter && !matchesFilter && !node.isHub) {
          nodeAlpha = 0.15;
        }

        ctx.save();
        ctx.globalAlpha = nodeAlpha;

        if (node.isHub) {
          // Subject Hub Orb (Planetary Core)
          const pulse = Math.sin(time * 1.5) * 2;
          const r = node.radius + (isHovered ? 4 : 0) + pulse;

          // Outer glowing aura
          const auraGrad = ctx.createRadialGradient(node.x, node.y, r * 0.3, node.x, node.y, r * 2.2);
          auraGrad.addColorStop(0, `${node.color}66`);
          auraGrad.addColorStop(0.7, `${node.color}15`);
          auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = auraGrad;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r * 2.2, 0, Math.PI * 2);
          ctx.fill();

          // Hub Sphere
          const hubGrad = ctx.createRadialGradient(
            node.x - r * 0.35,
            node.y - r * 0.35,
            r * 0.1,
            node.x,
            node.y,
            r
          );
          hubGrad.addColorStop(0, '#ffffff');
          hubGrad.addColorStop(0.35, node.color);
          hubGrad.addColorStop(1, '#090d16');

          ctx.fillStyle = hubGrad;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
          ctx.fill();

          // Rim
          ctx.strokeStyle = isHovered ? '#ffffff' : `${node.color}aa`;
          ctx.lineWidth = isHovered ? 2.5 : 1.5;
          ctx.stroke();

          // Hub Label Inside Orb
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px Outfit, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(node.label, node.x, node.y);

        } else {
          // Snippet Code Orb (Satellite Node)
          const r = isHovered ? node.radius + 3 : node.radius;

          // Glowing Aura
          const glowGrad = ctx.createRadialGradient(node.x, node.y, r * 0.2, node.x, node.y, r * 1.8);
          glowGrad.addColorStop(0, `${node.color}55`);
          glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r * 1.8, 0, Math.PI * 2);
          ctx.fill();

          // Orb body
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
          orbGrad.addColorStop(1, '#0b0f19');

          ctx.fillStyle = orbGrad;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
          ctx.fill();

          // Rim
          ctx.strokeStyle = isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.35)';
          ctx.lineWidth = isHovered ? 2 : 1;
          ctx.stroke();

          // Serial Number Badge Inside Orb
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`#${node.serialNumber}`, node.x, node.y);

          // Title Tag Label (Obsidian Floating Label)
          const title = node.label.length > 20 ? node.label.slice(0, 18) + '…' : node.label;
          ctx.font = '500 11px Outfit, sans-serif';
          const textW = ctx.measureText(title).width;
          const labelY = node.y + r + 13;

          // Label pill background
          ctx.fillStyle = isHovered ? 'rgba(15, 23, 42, 0.95)' : 'rgba(10, 14, 26, 0.75)';
          ctx.strokeStyle = isHovered ? node.color : 'rgba(255, 255, 255, 0.1)';
          ctx.lineWidth = 1;

          const px = node.x - textW / 2 - 6;
          const py = labelY - 8;
          const pw = textW + 12;
          const ph = 16;
          ctx.beginPath();
          ctx.roundRect(px, py, pw, ph, 8);
          ctx.fill();
          ctx.stroke();

          // Label text
          ctx.fillStyle = isHovered ? '#ffffff' : '#cbd5e1';
          ctx.fillText(title, node.x, labelY);
        }

        ctx.restore();
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      ro.disconnect();
    };
  }, [hoveredNode, selectedNode, searchFilter]);

  // Coordinate Converters
  const getCanvasCoords = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const s = stateRef.current;
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;

    const x = (screenX - s.transform.x) / s.transform.k;
    const y = (screenY - s.transform.y) / s.transform.k;
    return { x, y, screenX, screenY };
  }, []);

  const findNodeAt = useCallback((x, y) => {
    const s = stateRef.current;
    for (let i = s.nodes.length - 1; i >= 0; i--) {
      const node = s.nodes[i];
      const dx = node.x - x;
      const dy = node.y - y;
      const hitRadius = node.radius + 18; // Generous tap target for mobile touch
      if (dx * dx + dy * dy <= hitRadius * hitRadius) {
        return node;
      }
    }
    return null;
  }, []);

  // Pointer & Touch Handlers
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
      s.isDragging = true;
      s.dragStart = { x: screenX - s.transform.x, y: screenY - s.transform.y };
    }
  };

  const handlePointerMove = (e) => {
    const s = stateRef.current;
    const { x, y, screenX, screenY } = getCanvasCoords(e.clientX, e.clientY);

    const node = findNodeAt(x, y);
    setHoveredNode(node);

    if (!s.isDragging) return;

    const dist = Math.hypot(
      screenX - (s.dragStart.x + (s.dragNode ? 0 : s.transform.x)),
      screenY - (s.dragStart.y + (s.dragNode ? 0 : s.transform.y))
    );
    if (dist > 4) s.hasMoved = true;

    if (s.dragNode) {
      s.dragNode.x = x;
      s.dragNode.y = y;
      s.dragNode.vx = 0;
      s.dragNode.vy = 0;
    } else {
      s.transform.x = screenX - s.dragStart.x;
      s.transform.y = screenY - s.dragStart.y;
    }
  };

  const handlePointerUp = (e) => {
    const s = stateRef.current;
    const clickDuration = Date.now() - s.touchStartTime;

    if (!s.hasMoved && clickDuration < 400) {
      const { x, y } = getCanvasCoords(e.clientX, e.clientY);
      const clicked = findNodeAt(x, y);

      if (clicked) {
        if (!clicked.isHub && clicked.snippet) {
          // ONE CLICK OF ORB -> OPEN CODE PAGE WITH FULL ACCESS!
          onSelectSnippet(clicked.snippet);
        } else {
          // Tapping a hub focuses / toggles selection
          setSelectedNode(selectedNode?.id === clicked.id ? null : clicked);
        }
      } else {
        setSelectedNode(null);
      }
    }

    s.isDragging = false;
    s.dragNode = null;
    s.hasMoved = false;
  };

  // Wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const s = stateRef.current;
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.88;
    const newK = Math.min(Math.max(s.transform.k * zoomFactor, 0.4), 3.0);

    const { screenX, screenY } = getCanvasCoords(e.clientX, e.clientY);
    s.transform.x = screenX - (screenX - s.transform.x) * (newK / s.transform.k);
    s.transform.y = screenY - (screenY - s.transform.y) * (newK / s.transform.k);
    s.transform.k = newK;
  };

  // Pinch-to-zoom for mobile
  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const s = stateRef.current;

      if (s.lastTouchDistance) {
        const delta = dist / s.lastTouchDistance;
        const newZoom = Math.min(Math.max(s.transform.k * delta, 0.4), 3.0);
        s.transform.k = newZoom;
      }
      s.lastTouchDistance = dist;
    }
  };

  const handleTouchEnd = () => {
    stateRef.current.lastTouchDistance = null;
  };

  const zoomIn = () => {
    const s = stateRef.current;
    s.transform.k = Math.min(s.transform.k * 1.25, 3.0);
  };

  const zoomOut = () => {
    const s = stateRef.current;
    s.transform.k = Math.max(s.transform.k / 1.25, 0.4);
  };

  const resetView = () => {
    const s = stateRef.current;
    s.transform = { x: 0, y: 0, k: 1 };
    setSelectedNode(null);
  };

  return (
    <div
      ref={containerRef}
      className={`obsidian-graph-view ${isFullscreen ? 'fullscreen-mode' : ''}`}
      style={{
        position: 'relative',
        width: '100%',
        height: isFullscreen ? '100vh' : 'calc(100vh - 210px)',
        minHeight: '480px',
        backgroundColor: '#080c16',
        borderRadius: isFullscreen ? '0' : '22px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
        touchAction: 'none'
      }}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
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

      {/* Top Obsidian Controls HUD Bar */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          right: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          pointerEvents: 'none',
          zIndex: 10
        }}
      >
        {/* Left: Mode Switcher (Obsidian Global vs Current Subject) */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '999px',
            padding: '3px',
            pointerEvents: 'auto',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)'
          }}
        >
          <button
            onClick={() => setGraphMode('global')}
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              border: 'none',
              background: graphMode === 'global' ? 'linear-gradient(135deg, #a855f7, #6366f1)' : 'transparent',
              color: graphMode === 'global' ? '#ffffff' : '#94a3b8',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <Sparkles size={13} />
            <span>Vault Graph (Obsidian)</span>
          </button>

          <button
            onClick={() => setGraphMode('subject')}
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              border: 'none',
              background: graphMode === 'subject' ? `${subject.color || '#38bdf8'}33` : 'transparent',
              color: graphMode === 'subject' ? (subject.color || '#38bdf8') : '#94a3b8',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <Filter size={13} />
            <span>{subject.name} Only</span>
          </button>
        </div>

        {/* Right: Search In Graph + Node Count Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            pointerEvents: 'auto'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              padding: '4px 10px',
              gap: '6px'
            }}
          >
            <Search size={14} color="#94a3b8" />
            <input
              type="text"
              placeholder="Filter graph nodes..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f8fafc',
                fontSize: '12px',
                outline: 'none',
                width: '120px'
              }}
            />
          </div>

          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 600,
              color: '#94a3b8',
              fontFamily: '"JetBrains Mono", monospace'
            }}
          >
            {stats.nodes} Nodes • {stats.links} Links
          </div>
        </div>
      </div>

      {/* Floating Canvas Controls */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
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
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
          }}
        >
          <button
            onClick={zoomIn}
            title="Zoom In"
            aria-label="Zoom In"
            style={{
              width: '36px',
              height: '36px',
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
              width: '36px',
              height: '36px',
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
            onClick={resetView}
            title="Recenter Graph"
            aria-label="Recenter Graph"
            style={{
              width: '36px',
              height: '36px',
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
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Graph'}
            aria-label="Toggle Fullscreen Graph"
            style={{
              width: '36px',
              height: '36px',
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
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Floating Bottom Left: Add Snippet */}
      <button
        onClick={onAddNewSnippet}
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          background: 'linear-gradient(135deg, #38bdf8, #6366f1)',
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
          boxShadow: '0 4px 18px rgba(56, 189, 248, 0.4)',
          zIndex: 10
        }}
      >
        <Plus size={16} />
        <span>Add Code Orb</span>
      </button>

      {/* Hover Information Tooltip */}
      {hoveredNode && (
        <div
          style={{
            position: 'absolute',
            bottom: '70px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(16px)',
            border: `1.5px solid ${hoveredNode.color || '#38bdf8'}`,
            borderRadius: '14px',
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#f8fafc',
            fontSize: '13px',
            pointerEvents: 'none',
            zIndex: 20,
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.7)'
          }}
        >
          <span
            style={{
              padding: '3px 8px',
              borderRadius: '6px',
              background: `${hoveredNode.color || '#38bdf8'}22`,
              color: hoveredNode.color || '#38bdf8',
              fontWeight: 700,
              fontFamily: '"JetBrains Mono", monospace'
            }}
          >
            {hoveredNode.isHub ? 'SUBJECT' : `#${hoveredNode.serialNumber}`}
          </span>
          <span style={{ fontWeight: 600 }}>{hoveredNode.label}</span>
          {!hoveredNode.isHub && (
            <span style={{ color: '#38bdf8', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Code2 size={13} /> Click to Open Full Code
            </span>
          )}
        </div>
      )}
    </div>
  );
}
