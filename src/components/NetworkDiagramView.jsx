import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Plus,
  Search
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

  // Graph Scope: 'vault' (all subjects + snippets) or 'local' (current subject only)
  const [scope, setScope] = useState('vault');
  const [hoveredNode, setHoveredNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ nodes: 0, links: 0 });

  // Physics simulation state stored in ref for optimal 60fps performance without React re-renders
  const stateRef = useRef({
    nodes: [],
    links: [],
    transform: { x: 0, y: 0, k: 1 },
    dragNode: null,
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    lastTouchDistance: null,
    touchStartTime: 0,
    hasMoved: false,
    width: 800,
    height: 600,
    alpha: 1 // Simulation cooling parameter (1 = high energy, drops to 0 when settled)
  });

  // Re-build graph topology when scope, subjects, or snippets change
  useEffect(() => {
    const s = stateRef.current;
    const w = s.width || 800;
    const h = s.height || 600;

    let targetSubjects = [];
    let targetSnippets = [];

    if (scope === 'vault') {
      targetSubjects = allSubjects.length ? allSubjects : [subject];
      targetSnippets = allSnippets.length ? allSnippets : snippets;
    } else {
      targetSubjects = [subject];
      targetSnippets = snippets;
    }

    const newNodes = [];
    const newLinks = [];
    const existingNodeMap = new Map(s.nodes.map((n) => [n.id, n]));

    // 1. Create Subject Hub Nodes
    const subjectNodeMap = new Map();
    const subCount = targetSubjects.length;

    targetSubjects.forEach((sub, i) => {
      const existing = existingNodeMap.get(`sub-${sub.id}`);
      const angle = (i / (subCount || 1)) * 2 * Math.PI;
      const dist = subCount > 1 ? Math.min(w, h) * 0.26 : 0;

      const subNode = {
        id: `sub-${sub.id}`,
        isHub: true,
        subjectId: sub.id,
        label: sub.name,
        color: sub.color || '#2dd4bf',
        radius: subCount > 1 ? 22 : 28,
        x: existing ? existing.x : w / 2 + Math.cos(angle) * dist,
        y: existing ? existing.y : h / 2 + Math.sin(angle) * dist,
        vx: 0,
        vy: 0
      };

      subjectNodeMap.set(sub.id, subNode);
      newNodes.push(subNode);
    });

    // Cross-link subject hubs if vault view
    if (subCount > 1) {
      for (let i = 0; i < subCount; i++) {
        for (let j = i + 1; j < subCount; j++) {
          newLinks.push({
            source: `sub-${targetSubjects[i].id}`,
            target: `sub-${targetSubjects[j].id}`,
            isHubLink: true
          });
        }
      }
    }

    // 2. Create Snippet Nodes and connect them
    const snippetsBySubject = new Map();

    targetSnippets.forEach((snip) => {
      const parentHub = subjectNodeMap.get(snip.subjectId) || (subCount > 0 ? newNodes[0] : null);
      const existing = existingNodeMap.get(snip.id);

      // Initial placement around its hub
      const angle = Math.random() * 2 * Math.PI;
      const dist = 70 + Math.random() * 110;

      const snipNode = {
        id: snip.id,
        isHub: false,
        subjectId: snip.subjectId,
        snippetData: snip,
        label: snip.title,
        serialNumber: snip.serialNumber || 1,
        color: parentHub ? parentHub.color : '#2dd4bf',
        radius: 12,
        x: existing ? existing.x : (parentHub ? parentHub.x : w / 2) + Math.cos(angle) * dist,
        y: existing ? existing.y : (parentHub ? parentHub.y : h / 2) + Math.sin(angle) * dist,
        vx: 0,
        vy: 0
      };

      newNodes.push(snipNode);

      // Link to parent subject hub
      if (parentHub) {
        newLinks.push({
          source: parentHub.id,
          target: snip.id,
          isHubLink: false
        });
      }

      if (!snippetsBySubject.has(snip.subjectId)) {
        snippetsBySubject.set(snip.subjectId, []);
      }
      snippetsBySubject.get(snip.subjectId).push(snipNode);
    });

    // 3. Connect sequential snippets (#1 -> #2 -> #3) to form study chains
    snippetsBySubject.forEach((list) => {
      list.sort((a, b) => a.serialNumber - b.serialNumber);
      for (let i = 0; i < list.length - 1; i++) {
        newLinks.push({
          source: list[i].id,
          target: list[i + 1].id,
          isSequential: true
        });
      }
    });

    s.nodes = newNodes;
    s.links = newLinks;
    s.alpha = 1; // Restart physics simulation
    setStats({ nodes: newNodes.length, links: newLinks.length });
  }, [scope, subject, snippets, allSubjects, allSnippets]);

  // Canvas Resize Observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const s = stateRef.current;
      s.width = rect.width;
      s.height = rect.height;

      const canvas = canvasRef.current;
      if (canvas) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
      }
      s.alpha = Math.max(s.alpha, 0.4);
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(container);

    return () => ro.disconnect();
  }, []);

  // Force-Directed Physics & Canvas Render Loop (Obsidian Engine)
  useEffect(() => {
    let animationFrameId;

    const render = () => {
      const s = stateRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const w = s.width || 800;
      const h = s.height || 600;

      // 1. Force-Directed Physics Step
      if (s.alpha > 0.005 || s.dragNode) {
        const nodeMap = new Map(s.nodes.map((n) => [n.id, n]));
        const count = s.nodes.length;
        const alpha = Math.min(s.alpha, 0.8);

        // A. Repulsion between all node pairs (Coulomb force)
        for (let i = 0; i < count; i++) {
          const a = s.nodes[i];
          for (let j = i + 1; j < count; j++) {
            const b = s.nodes[j];
            let dx = b.x - a.x;
            let dy = b.y - a.y;
            let distSq = dx * dx + dy * dy;
            if (distSq === 0) {
              dx = (Math.random() - 0.5) * 2;
              dy = (Math.random() - 0.5) * 2;
              distSq = dx * dx + dy * dy;
            }

            const dist = Math.sqrt(distSq);
            // Repulsion strength
            const force = (a.isHub || b.isHub ? 1200 : 600) / (distSq + 100);
            const fx = (dx / dist) * force * alpha;
            const fy = (dy / dist) * force * alpha;

            if (a !== s.dragNode) {
              a.vx -= fx;
              a.vy -= fy;
            }
            if (b !== s.dragNode) {
              b.vx += fx;
              b.vy += fy;
            }
          }
        }

        // B. Spring attraction along links (Hooke force)
        s.links.forEach((link) => {
          const a = nodeMap.get(link.source);
          const b = nodeMap.get(link.target);
          if (!a || !b) return;

          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 1;
          const targetDist = link.isHubLink ? 140 : link.isSequential ? 60 : 85;
          const delta = dist - targetDist;
          const strength = link.isSequential ? 0.045 : 0.035;

          const fx = (dx / dist) * delta * strength * alpha;
          const fy = (dy / dist) * delta * strength * alpha;

          if (a !== s.dragNode) {
            a.vx += fx;
            a.vy += fy;
          }
          if (b !== s.dragNode) {
            b.vx -= fx;
            b.vy -= fy;
          }
        });

        // C. Centering gravity force towards canvas center
        const cx = w / 2;
        const cy = h / 2;
        const gravity = 0.012 * alpha;

        s.nodes.forEach((node) => {
          if (node === s.dragNode) return;
          node.vx += (cx - node.x) * gravity;
          node.vy += (cy - node.y) * gravity;

          // Velocity damping & position integration
          node.vx *= 0.88;
          node.vy *= 0.88;
          node.x += node.vx;
          node.y += node.vy;
        });

        // Decay simulation energy gradually
        s.alpha *= 0.985;
      }

      // 2. Canvas Drawing Step
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      // Matte dark background
      ctx.fillStyle = '#111113';
      ctx.fillRect(0, 0, w, h);

      // Subtle dot grid background for spatial orientation
      ctx.fillStyle = '#1d1d22';
      const gridSize = 32 * s.transform.k;
      const offsetX = (s.transform.x % gridSize + gridSize) % gridSize;
      const offsetY = (s.transform.y % gridSize + gridSize) % gridSize;

      for (let gx = offsetX; gx < w; gx += gridSize) {
        for (let gy = offsetY; gy < h; gy += gridSize) {
          ctx.beginPath();
          ctx.arc(gx, gy, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Apply Pan & Zoom Transform
      ctx.translate(s.transform.x, s.transform.y);
      ctx.scale(s.transform.k, s.transform.k);

      const activeHover = hoveredNode;
      const nodeMap = new Map(s.nodes.map((n) => [n.id, n]));

      // Determine 1-hop connected nodes to the hovered node (Obsidian graph neighborhood)
      const connectedNodeIds = new Set();
      if (activeHover) {
        connectedNodeIds.add(activeHover.id);
        s.links.forEach((l) => {
          if (l.source === activeHover.id) connectedNodeIds.add(l.target);
          if (l.target === activeHover.id) connectedNodeIds.add(l.source);
        });
      }

      const filterLower = (searchQuery || '').trim().toLowerCase();
      const hasFilter = filterLower.length > 0;

      // Draw Links
      s.links.forEach((link) => {
        const a = nodeMap.get(link.source);
        const b = nodeMap.get(link.target);
        if (!a || !b) return;

        const isLinkConnectedToHover =
          activeHover && (a.id === activeHover.id || b.id === activeHover.id);

        let strokeColor = '#242429';
        let strokeWidth = 1;

        if (activeHover) {
          if (isLinkConnectedToHover) {
            strokeColor = '#52525b';
            strokeWidth = 1.8;
          } else {
            strokeColor = '#18181c';
          }
        } else if (link.isSequential) {
          strokeColor = '#2d2d34';
          strokeWidth = 1.2;
        }

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      });

      // Draw Nodes
      s.nodes.forEach((node) => {
        const isHovered = activeHover && activeHover.id === node.id;
        const isNeighbor = activeHover && connectedNodeIds.has(node.id);
        const labelStr = String(node?.label || '');
        const matchesFilter = hasFilter && labelStr.toLowerCase().includes(filterLower);

        // Alpha calculation
        let alpha = 1;
        if (activeHover && !isNeighbor) {
          alpha = 0.22;
        }
        if (hasFilter && !matchesFilter && !node.isHub) {
          alpha = 0.15;
        }

        ctx.save();
        ctx.globalAlpha = alpha;

        if (node.isHub) {
          // Subject Hub Node: clean disc with crisp border & centered label
          const r = node.radius + (isHovered ? 2 : 0);

          ctx.fillStyle = '#18181b';
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = isHovered ? '#ffffff' : (node.color || 'var(--accent)');
          ctx.lineWidth = isHovered ? 2.5 : 2;
          ctx.stroke();

          // Hub label
          ctx.fillStyle = '#f4f4f5';
          ctx.font = '600 12px "Outfit", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(labelStr, node.x, node.y);
        } else {
          // Snippet Node: clean solid circular dot
          const r = isHovered ? node.radius + 3 : node.radius;

          ctx.fillStyle = node.color || '#2dd4bf';
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = isHovered ? '#ffffff' : '#27272a';
          ctx.lineWidth = isHovered ? 2 : 1.5;
          ctx.stroke();

          // Serial number inside dot
          ctx.fillStyle = '#09090b';
          ctx.font = '700 9px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${node.serialNumber || 1}`, node.x, node.y);

          // Obsidian Label (shown if hovered, neighbor, or zoomed in)
          const shouldShowLabel = isHovered || isNeighbor || matchesFilter || s.transform.k > 1.1;

          if (shouldShowLabel) {
            const title = labelStr.length > 24 ? labelStr.slice(0, 22) + '…' : labelStr;
            ctx.font = '500 11px "Outfit", sans-serif';
            const textW = ctx.measureText(title).width;
            const labelY = node.y + r + 11;

            // Matte label badge
            const padX = 6;
            const padY = 3;
            ctx.fillStyle = isHovered ? '#27272a' : '#18181b';
            ctx.strokeStyle = isHovered ? (node.color || 'var(--accent)') : '#2e2e34';
            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.roundRect(
              node.x - textW / 2 - padX,
              labelY - 7 - padY,
              textW + padX * 2,
              14 + padY * 2,
              4
            );
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = isHovered ? '#ffffff' : '#d4d4d8';
            ctx.fillText(title, node.x, labelY);
          }
        }

        ctx.restore();
      });

      ctx.restore();
      // Only keep scheduling if physics is active or user is interacting
      if (s.alpha > 0.005 || s.dragNode || s.isDragging) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [hoveredNode, searchQuery]);

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
      const hitRadius = node.radius + 14; // Generous tap target for mobile touch
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
      s.alpha = Math.max(s.alpha, 0.4);
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

    const distMoved = Math.hypot(
      screenX - (s.dragNode ? s.dragStart.x : s.dragStart.x + s.transform.x),
      screenY - (s.dragNode ? s.dragStart.y : s.dragStart.y + s.transform.y)
    );
    if (distMoved > 4) {
      s.hasMoved = true;
    }

    if (s.dragNode) {
      s.dragNode.x = x;
      s.dragNode.y = y;
      s.dragNode.vx = 0;
      s.dragNode.vy = 0;
      s.alpha = Math.max(s.alpha, 0.3);
    } else {
      // Pan canvas
      s.transform.x = screenX - s.dragStart.x;
      s.transform.y = screenY - s.dragStart.y;
    }
  };

  const handlePointerUp = (e) => {
    const s = stateRef.current;
    const clickDuration = Date.now() - s.touchStartTime;

    // Check if it was a clean click/tap (not a drag)
    if (!s.hasMoved && clickDuration < 350) {
      const { x, y } = getCanvasCoords(e.clientX, e.clientY);
      const clicked = findNodeAt(x, y);

      if (clicked) {
        if (!clicked.isHub && clicked.snippetData) {
          // Open code snippet modal with full access!
          onSelectSnippet(clicked.snippetData);
        }
      }
    }

    s.dragNode = null;
    s.isDragging = false;
  };

  // Zoom via Mouse Wheel
  const handleWheel = (e) => {
    e.preventDefault();
    const s = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    const newK = Math.min(Math.max(s.transform.k * zoomFactor, 0.35), 3.5);

    // Zoom centered around mouse pointer
    s.transform.x = mouseX - (mouseX - s.transform.x) * (newK / s.transform.k);
    s.transform.y = mouseY - (mouseY - s.transform.y) * (newK / s.transform.k);
    s.transform.k = newK;
  };

  // Touch Pinch-to-Zoom on Mobile
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      stateRef.current.lastTouchDistance = dist;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const s = stateRef.current;
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );

      if (s.lastTouchDistance) {
        const factor = dist / s.lastTouchDistance;
        const newK = Math.min(Math.max(s.transform.k * factor, 0.35), 3.5);
        s.transform.k = newK;
      }
      s.lastTouchDistance = dist;
    }
  };

  // Zoom Controls
  const zoomIn = () => {
    const s = stateRef.current;
    const newK = Math.min(s.transform.k * 1.25, 3.5);
    s.transform.k = newK;
  };

  const zoomOut = () => {
    const s = stateRef.current;
    const newK = Math.max(s.transform.k * 0.8, 0.35);
    s.transform.k = newK;
  };

  const resetView = () => {
    const s = stateRef.current;
    s.transform = { x: 0, y: 0, k: 1 };
    s.alpha = 1;
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: 'calc(100vh - 160px)',
        minHeight: '480px',
        backgroundColor: '#111113',
        borderRadius: 'var(--radius-l)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        userSelect: 'none'
      }}
    >
      {/* Interactive Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          touchAction: 'none',
          cursor: 'grab'
        }}
      />

      {/* Obsidian Header Controls Bar */}
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
          pointerEvents: 'none',
          flexWrap: 'wrap'
        }}
      >
        {/* Left: Scope Selector & Stats */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            pointerEvents: 'auto',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-m)',
            padding: '3px 4px'
          }}
        >
          <button
            onClick={() => setScope('vault')}
            style={{
              padding: '5px 10px',
              fontSize: '11.5px',
              fontWeight: 500,
              background: scope === 'vault' ? 'var(--bg-raised)' : 'transparent',
              color: scope === 'vault' ? 'var(--text-primary)' : 'var(--text-dim)',
              borderRadius: 'var(--radius-s)',
              border: 'none'
            }}
          >
            Vault Graph
          </button>
          <button
            onClick={() => setScope('local')}
            style={{
              padding: '5px 10px',
              fontSize: '11.5px',
              fontWeight: 500,
              background: scope === 'local' ? 'var(--bg-raised)' : 'transparent',
              color: scope === 'local' ? 'var(--text-primary)' : 'var(--text-dim)',
              borderRadius: 'var(--radius-s)',
              border: 'none'
            }}
          >
            {subject.name}
          </button>

          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--text-dim)',
              padding: '0 8px',
              borderLeft: '1px solid var(--border)'
            }}
          >
            {stats.nodes} nodes · {stats.links} links
          </span>
        </div>

        {/* Right: Search Filter Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            pointerEvents: 'auto',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-m)',
            padding: '4px 10px'
          }}
        >
          <Search size={13} color="var(--text-dim)" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '12px',
              width: '110px'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                background: 'transparent',
                color: 'var(--text-dim)',
                fontSize: '11px',
                padding: '0 2px'
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Floating Bottom Toolbar (Zoom, Center & Add) */}
      <div
        style={{
          position: 'absolute',
          bottom: '14px',
          right: '14px',
          display: 'flex',
          gap: '6px',
          pointerEvents: 'auto',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-m)',
          padding: '4px'
        }}
      >
        <button
          onClick={zoomIn}
          title="Zoom In"
          style={{
            background: 'transparent',
            color: 'var(--text-body)',
            padding: '7px',
            borderRadius: 'var(--radius-s)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <ZoomIn size={15} />
        </button>

        <button
          onClick={zoomOut}
          title="Zoom Out"
          style={{
            background: 'transparent',
            color: 'var(--text-body)',
            padding: '7px',
            borderRadius: 'var(--radius-s)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <ZoomOut size={15} />
        </button>

        <button
          onClick={resetView}
          title="Reset View"
          style={{
            background: 'transparent',
            color: 'var(--text-body)',
            padding: '7px',
            borderRadius: 'var(--radius-s)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <RefreshCw size={15} />
        </button>

        <div style={{ width: '1px', background: 'var(--border)', margin: '4px 2px' }} />

        <button
          onClick={onAddNewSnippet}
          title="Add Snippet"
          style={{
            background: 'var(--accent)',
            color: '#000000',
            padding: '7px 10px',
            borderRadius: 'var(--radius-s)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            fontWeight: 600
          }}
        >
          <Plus size={15} />
          <span>Add</span>
        </button>
      </div>

      {/* Mobile Hint Overlay on First View */}
      <div
        style={{
          position: 'absolute',
          bottom: '14px',
          left: '14px',
          fontSize: '11px',
          color: 'var(--text-dim)',
          pointerEvents: 'none',
          background: 'var(--bg-surface)',
          padding: '4px 8px',
          borderRadius: 'var(--radius-s)',
          border: '1px solid var(--border)'
        }}
      >
        Click any node to open code
      </div>
    </div>
  );
}
