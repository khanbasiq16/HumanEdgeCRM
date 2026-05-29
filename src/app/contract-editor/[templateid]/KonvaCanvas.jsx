"use client";
import React, { useRef, useEffect, useState, useCallback } from "react";

/* ── Axis-aligned bounding box intersection ── */
function intersects(a, b) {
  return !(b.x > a.x + a.width || b.x + b.width < a.x || b.y > a.y + a.height || b.y + b.height < a.y);
}

/* ── Custom draw-tool cursors ── */
const _svg = (s, hx, hy) =>
  `url("data:image/svg+xml,${encodeURIComponent(s)}") ${hx} ${hy}, crosshair`;

const TOOL_CURSORS = {
  select: "default",
  pen: _svg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" stroke="white" stroke-width="1.5" fill="none"/>
      <path d="M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" stroke="white" stroke-width="1.5" fill="none"/>
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="#111"/>
      <path d="M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="#444"/>
    </svg>`,
    3, 21
  ),
  brush: _svg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3z" stroke="white" stroke-width="1" fill="none"/>
      <path d="M20.71 4.63l-1.34-1.34a1 1 0 0 0-1.41 0L9 12.25 11.75 15l8.96-8.96a1 1 0 0 0 0-1.41z" stroke="white" stroke-width="1" fill="none"/>
      <path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3z" fill="#1e88e5"/>
      <path d="M20.71 4.63l-1.34-1.34a1 1 0 0 0-1.41 0L9 12.25 11.75 15l8.96-8.96a1 1 0 0 0 0-1.41z" fill="#111"/>
    </svg>`,
    3, 20
  ),
  eraser: _svg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <path d="M15.14 3c-.51 0-1.02.2-1.41.59L2.59 14.73c-.78.77-.78 2.04 0 2.83L5.03 20H20v-2H8.44l-2-2 7.17-7.17 4.88 4.88 2.44-2.44L16.56 3.59A2 2 0 0 0 15.14 3z" stroke="white" stroke-width="1" fill="none"/>
      <path d="M15.14 3c-.51 0-1.02.2-1.41.59L2.59 14.73c-.78.77-.78 2.04 0 2.83L5.03 20H20v-2H8.44l-2-2 7.17-7.17 4.88 4.88 2.44-2.44L16.56 3.59A2 2 0 0 0 15.14 3z" fill="#555"/>
      <rect x="5" y="20" width="15" height="2" rx="1" fill="#999"/>
    </svg>`,
    12, 12
  ),
};

/* ── Text edit overlay (pure DOM — no Konva dependency) ── */
const TextEditOverlay = ({ editing, onCommit, onCancel }) => {
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
  return (
    <textarea
      ref={ref}
      defaultValue={editing.text}
      style={{
        position: "fixed",
        top: editing.y + "px",
        left: editing.x + "px",
        width: Math.max(editing.w, 100) + "px",
        minHeight: Math.max(editing.h, 30) + "px",
        fontSize: editing.fontSize + "px",
        fontFamily: editing.fontFamily || "Arial",
        fontWeight: editing.fontWeight || "normal",
        fontStyle: editing.fontStyle || "normal",
        color: editing.fill || "#000",
        background: "rgba(255,255,255,0.97)",
        border: "2px solid #3b82f6",
        borderRadius: "4px",
        outline: "none",
        resize: "none",
        padding: "2px 4px",
        lineHeight: 1.2,
        zIndex: 1000,
        boxSizing: "border-box",
      }}
      onBlur={(e) => onCommit(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Escape")        { e.preventDefault(); onCancel(); }
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onCommit(e.target.value); }
        e.stopPropagation();
      }}
    />
  );
};

/* ── Build a single Konva node from a shape descriptor ── */
function buildNode(K, shape, draggable, onChange, onSelect, onTextDblClick) {
  const base = {
    id: shape.id,
    x: shape.x || 0,
    y: shape.y || 0,
    rotation: shape.rotation || 0,
    scaleX: shape.scaleX || 1,
    scaleY: shape.scaleY || 1,
    opacity: shape.opacity ?? 1,
    draggable,
  };
  const fs = {
    fill:        (!shape.fill   || shape.fill   === "transparent") ? "rgba(0,0,0,0)" : shape.fill,
    stroke:      (!shape.stroke || shape.stroke === "transparent") ? undefined        : shape.stroke,
    strokeWidth: shape.strokeWidth || 0,
  };

  // Only eraser strokes are non-interactive — pen/brush strokes remain selectable
  if (shape._eraser) { base.draggable = false; base.listening = false; }

  let node;
  switch (shape.type) {
    case "rect":
      node = new K.Rect({ ...base, ...fs, width: shape.width || 200, height: shape.height || 120, cornerRadius: shape.cornerRadius || 0 });
      break;
    case "circle":
      node = new K.Circle({ ...base, ...fs, radius: shape.radius || 60 });
      break;
    case "ellipse":
      node = new K.Ellipse({ ...base, ...fs, radiusX: shape.radiusX || 40, radiusY: shape.radiusY || 20 });
      break;
    case "polygon":
      node = new K.RegularPolygon({ ...base, ...fs, sides: shape.sides || 6, radius: shape.radius || 50 });
      break;
    case "star":
      node = new K.Star({ ...base, ...fs, numPoints: shape.numPoints || 5, innerRadius: shape.innerRadius || 22, outerRadius: shape.outerRadius || 50 });
      break;
    case "line":
      node = new K.Line({
        ...base,
        points:      shape.points || [0, 0, 200, 0],
        fill:        shape.closed ? fs.fill : undefined,
        stroke:      fs.stroke || (shape.closed ? undefined : "#374151"),
        strokeWidth: shape.strokeWidth || (shape.closed ? 0 : 2),
        closed:      !!shape.closed,
        dash:        shape.dash,
        lineCap:     shape.lineCap || "round",
        lineJoin:    "round",
      });
      break;
    case "path":
      node = new K.Path({ ...base, ...fs, data: shape.pathData || "" });
      break;
    case "i-text": case "text": case "signature":
      node = new K.Text({
        ...base,
        text:           shape.text || "",
        fontSize:       shape.fontSize   || 16,
        fontFamily:     shape.fontFamily || "Arial",
        fontStyle:      [shape.fontStyle === "italic" ? "italic" : "", shape.fontWeight === "bold" ? "bold" : ""].filter(Boolean).join(" ") || "normal",
        textDecoration: shape.underline ? "underline" : "",
        align:          shape.align || "left",
        fill:           shape.fill || "#1a1a1a",
        width:          shape.width,
        wrap:           "word",
      });
      // dblclick is handled at stage level (see init) — node rebuilds would break per-node dblclick
      break;
    case "image":
      node = new K.Image({ ...base, width: shape.width || 200, height: shape.height || 200 });
      if (shape.src) {
        const img = new window.Image();
        if (!shape.src.startsWith("data:")) img.crossOrigin = "anonymous";
        img.onload = () => { node.image(img); node.getLayer()?.batchDraw(); };
        img.src = shape.src;
      }
      break;
    case "drawing":
      node = new K.Line({
        ...base,
        points:      shape.points || [],
        stroke:      shape._eraser ? "#000000" : (shape.drawColor || "#000"),
        strokeWidth: shape.drawWidth || 3,
        tension:     0.5,
        lineCap:     "round",
        lineJoin:    "round",
        globalCompositeOperation: shape._eraser ? "destination-out" : "source-over",
      });
      break;
    default:
      return null;
  }

  if (node && !shape._eraser) {
    // click/dblclick handled at stage level — only transform/drag here
    node.on("dragend",   (e) => onChange(shape.id, { x: e.target.x(), y: e.target.y() }));
    node.on("transformend", (e) => {
      const n = e.target;
      onChange(shape.id, { x: n.x(), y: n.y(), scaleX: n.scaleX(), scaleY: n.scaleY(), rotation: n.rotation() });
    });
  }
  return node;
}

/* ═══════════════════════════════
   MAIN KONVA CANVAS COMPONENT
   Uses Konva.js directly — no react-konva / react-reconciler
   ═══════════════════════════════ */
export default function KonvaCanvas({
  stageRef,
  shapes,
  selectedId,
  selectedIds,
  onSelect,
  onSelectMultiple,
  onChange,
  drawTool,
  brushColor,
  brushSize,
  bgColor,
  pageW,
  pageH,
  drawingLine,
  setDrawingLine,
  setShapes,
  dirty,
}) {
  const containerRef     = useRef(null);
  const layerRef         = useRef(null);
  const bgLayerRef       = useRef(null);
  const selLayerRef      = useRef(null);   // top layer — only the marquee rect lives here
  const selRectRef       = useRef(null);   // the blue dashed selection rectangle
  const isSelectingRef   = useRef(false);  // true while drag-selecting
  const selStartRef      = useRef({ x:0, y:0 });
  const trRef            = useRef(null);
  const bgRef            = useRef(null);
  const KRef             = useRef(null);
  const liveStrokeRef    = useRef(null);
  const onSelectMultipleRef = useRef(onSelectMultiple);

  // Keep latest values in refs so event handlers (set up once) see current values
  const drawToolRef   = useRef(drawTool);
  const brushColorRef = useRef(brushColor);
  const brushSizeRef  = useRef(brushSize);
  const bgColorRef    = useRef(bgColor);
  const onSelectRef            = useRef(onSelect);
  const onChangeRef            = useRef(onChange);
  const shapesRef              = useRef(shapes);         // always current shapes for stage dblclick
  const handleTextDblClickRef  = useRef(null);           // set after handleTextDblClick is defined

  useEffect(() => { drawToolRef.current          = drawTool;        }, [drawTool]);
  useEffect(() => { brushColorRef.current        = brushColor;      }, [brushColor]);
  useEffect(() => { brushSizeRef.current         = brushSize;       }, [brushSize]);
  useEffect(() => { bgColorRef.current           = bgColor;         }, [bgColor]);
  useEffect(() => { onSelectRef.current          = onSelect;        }, [onSelect]);
  useEffect(() => { onChangeRef.current          = onChange;        }, [onChange]);
  useEffect(() => { onSelectMultipleRef.current  = onSelectMultiple;}, [onSelectMultiple]);
  useEffect(() => { shapesRef.current            = shapes;          }, [shapes]);

  const [textEditing, setTextEditing] = useState(null);

  /* ── Text double-click handler ── */
  const handleTextDblClick = useCallback((shape) => {
    const stage = stageRef.current;
    if (!stage) return;
    const node = stage.findOne("#" + shape.id);
    if (!node) return;
    const box    = stage.container().getBoundingClientRect();
    const absPos = node.getAbsolutePosition();
    node.visible(false);
    stage.batchDraw();
    setTextEditing({
      id:         shape.id,
      x:          box.left + absPos.x,
      y:          box.top  + absPos.y,
      w:          Math.max((node.width()  || 200) * (node.scaleX() || 1), 100),
      h:          Math.max((node.height() || 40)  * (node.scaleY() || 1), 30),
      text:       shape.text       || "",
      fontSize:   shape.fontSize   || 16,
      fontFamily: shape.fontFamily || "Arial",
      fontWeight: shape.fontWeight || "normal",
      fontStyle:  shape.fontStyle  || "normal",
      fill:       shape.fill       || "#000",
    });
  }, [stageRef]);

  const commitEdit = useCallback((newText) => {
    setTextEditing(prev => {
      if (!prev) return null;
      onChangeRef.current(prev.id, { text: newText });
      const node = stageRef.current?.findOne("#" + prev.id);
      if (node) { node.visible(true); stageRef.current?.batchDraw(); }
      return null;
    });
  }, [stageRef]);

  const cancelEdit = useCallback(() => {
    setTextEditing(prev => {
      if (!prev) return null;
      const node = stageRef.current?.findOne("#" + prev.id);
      if (node) { node.visible(true); stageRef.current?.batchDraw(); }
      return null;
    });
  }, [stageRef]);

  // Keep ref in sync so stage-level dblclick handler always sees latest version
  useEffect(() => { handleTextDblClickRef.current = handleTextDblClick; }, [handleTextDblClick]);

  /* ── Initialize Stage (runs once on mount) ── */
  useEffect(() => {
    if (!containerRef.current || typeof window === "undefined") return;
    let cancelled = false;

    import("konva").then((mod) => {
      if (cancelled) return;
      const K = mod.default ?? mod;
      KRef.current = K;

      const stage    = new K.Stage({ container: containerRef.current, width: pageW, height: pageH });
      const bgLayer  = new K.Layer({ listening: false });
      const layer    = new K.Layer();
      const selLayer = new K.Layer({ listening: false }); // top — marquee rect only
      stage.add(bgLayer);
      stage.add(layer);
      stage.add(selLayer);

      const bg = new K.Rect({ width: pageW, height: pageH, fill: bgColor, listening: false, attrs: { isBackground: true } });
      bgLayer.add(bg);
      bgLayerRef.current  = bgLayer;
      selLayerRef.current = selLayer;

      /* marquee selection rectangle */
      const selRect = new K.Rect({
        x:0, y:0, width:0, height:0,
        fill: "rgba(59,130,246,0.07)",
        stroke: "#3b82f6",
        strokeWidth: 1,
        dash: [5, 3],
        visible: false,
        listening: false,
        cornerRadius: 2,
      });
      selLayer.add(selRect);
      selRectRef.current = selRect;

      const tr = new K.Transformer({
        rotateEnabled: true,
        boundBoxFunc: (old, nw) => Math.abs(nw.width) < 5 || Math.abs(nw.height) < 5 ? old : nw,
      });
      layer.add(tr);

      stageRef.current = stage;
      layerRef.current = layer;
      trRef.current    = tr;
      bgRef.current    = bg;

      /* ── Pointer: mousedown ── */
      stage.on("mousedown touchstart", (e) => {
        const tool = drawToolRef.current;

        if (tool === "select") {
          if (e.target === stage || e.target.attrs?.isBackground) {
            onSelectRef.current(null);
            /* start marquee */
            const pos = stage.getPointerPosition();
            if (!pos) return;
            selStartRef.current  = { x: pos.x, y: pos.y };
            isSelectingRef.current = true;
            selRect.setAttrs({ x: pos.x, y: pos.y, width: 0, height: 0, visible: true });
            selLayer.batchDraw();
          }
          return;
        }

        /* drawing tools */
        const pos = stage.getPointerPosition();
        if (!pos) return;
        const isEraser = tool === "eraser";
        const newLine = {
          id:        `d${Date.now()}`,
          type:      "drawing",
          x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1,
          points:    [pos.x, pos.y],
          drawColor: isEraser ? "#000000" : brushColorRef.current,
          drawWidth: isEraser         ? brushSizeRef.current * 5
                   : tool === "brush" ? Math.round(brushSizeRef.current * 2.5)
                   :                   brushSizeRef.current,
          _eraser:   isEraser,
        };
        const lineNode = new K.Line({
          points: newLine.points, stroke: newLine.drawColor, strokeWidth: newLine.drawWidth,
          tension: 0.5, lineCap: "round", lineJoin: "round", listening: false,
          globalCompositeOperation: isEraser ? "destination-out" : "source-over",
        });
        layer.add(lineNode);
        lineNode.moveToTop();
        liveStrokeRef.current = lineNode;
        setDrawingLine(newLine);
      });

      /* ── Pointer: mousemove ── */
      stage.on("mousemove touchmove", () => {
        /* marquee drag */
        if (isSelectingRef.current) {
          const pos = stage.getPointerPosition();
          if (!pos) return;
          const sx = selStartRef.current.x, sy = selStartRef.current.y;
          const rx = Math.min(pos.x, sx), ry = Math.min(pos.y, sy);
          const rw = Math.abs(pos.x - sx),  rh = Math.abs(pos.y - sy);
          selRect.setAttrs({ x: rx, y: ry, width: rw, height: rh });
          selLayer.batchDraw();

          /* real-time transformer — no React state → zero re-renders */
          const selBox = { x: rx, y: ry, width: rw, height: rh };
          const hits = [];
          layer.getChildren().forEach(child => {
            if (child === tr || !child.id() || !child.listening()) return;
            const box = child.getClientRect();
            if (intersects(selBox, box)) hits.push(child);
          });
          tr.nodes(hits);
          layer.batchDraw();
          return;
        }

        /* freehand drawing */
        const ln = liveStrokeRef.current;
        if (!ln) return;
        const pos = stage.getPointerPosition();
        if (!pos) return;
        ln.points(ln.points().concat([pos.x, pos.y]));
        layer.batchDraw();
      });

      /* ── Pointer: mouseup ── */
      stage.on("mouseup touchend", () => {
        /* finish marquee */
        if (isSelectingRef.current) {
          isSelectingRef.current = false;
          selRect.visible(false);
          selLayer.batchDraw();
          /* sync selected IDs to React state (one update, after drag ends) */
          const ids = tr.nodes().map(n => n.id()).filter(Boolean);
          onSelectMultipleRef.current(ids);
          return;
        }

        /* finish freehand stroke */
        const ln = liveStrokeRef.current;
        if (!ln) return;
        const pts = ln.points();
        ln.destroy();
        liveStrokeRef.current = null;
        layer.batchDraw();
        setDrawingLine(prev => {
          if (prev && pts.length > 4) {
            setShapes(s => [...s, { ...prev, points: pts }]);
            dirty.current = true;
          }
          return null;
        });
      });

      /* ── Stage-level click: selection + manual double-click detection ──
         Konva's built-in dblclick requires the SAME node reference twice,
         which breaks when nodes are rebuilt after the first click.
         We detect double-clicks by ID + timestamp instead.            ── */
      let _lastId   = null;
      let _lastTime = 0;

      stage.on("click tap", (e) => {
        if (drawToolRef.current !== "select") return;

        /* click on empty canvas → deselect */
        if (e.target === stage || e.target.attrs?.isBackground) {
          onSelectRef.current(null);
          _lastId = null; _lastTime = 0;
          return;
        }

        /* resolve the real shape node ID:
           e.target might be the transformer border/handle, so fall back to
           whatever node the transformer currently wraps */
        let nodeId = e.target?.id?.();
        if (!nodeId || !shapesRef.current.find(s => s.id === nodeId)) {
          nodeId = tr.nodes()[0]?.id?.() ?? null;
        }
        if (!nodeId) return;

        const now = Date.now();
        const isDbl = nodeId === _lastId && (now - _lastTime) < 400;
        _lastId   = nodeId;
        _lastTime = now;

        if (isDbl) {
          /* double-click → open text editor */
          const shape = shapesRef.current.find(s => s.id === nodeId);
          if (shape && ["i-text","text","signature"].includes(shape.type)) {
            _lastId = null; _lastTime = 0;
            handleTextDblClickRef.current?.(shape);
          }
        } else {
          /* single click → select */
          onSelectRef.current(nodeId);
        }
      });

      layer.batchDraw();
    });

    return () => {
      cancelled = true;
      stageRef.current?.destroy();
      stageRef.current   = null;
      layerRef.current   = null;
      bgLayerRef.current = null;
      selLayerRef.current = null;
      selRectRef.current  = null;
      trRef.current      = null;
      bgRef.current      = null;
      KRef.current       = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Resize stage when page dimensions change ── */
  useEffect(() => {
    const stage = stageRef.current;
    const bg    = bgRef.current;
    if (!stage || !bg) return;
    stage.size({ width: pageW, height: pageH });
    bg.size({ width: pageW, height: pageH });
    bgLayerRef.current?.batchDraw();
    layerRef.current?.batchDraw();
  }, [pageW, pageH, stageRef]);

  /* ── Update background color ── */
  useEffect(() => {
    bgRef.current?.fill(bgColor);
    bgLayerRef.current?.batchDraw();
  }, [bgColor]);

  /* ── Re-render all shapes ── */
  useEffect(() => {
    const layer = layerRef.current;
    const K     = KRef.current;
    const tr    = trRef.current;
    if (!layer || !K || !tr) return;

    // Destroy old shape nodes; keep the transformer and any in-progress live stroke
    layer.getChildren().forEach(child => {
      if (child !== tr && child !== liveStrokeRef.current) child.destroy();
    });

    const draggable = drawTool === "select";
    shapes.forEach(shape => {
      const node = buildNode(K, shape, draggable, onChange, onSelect, handleTextDblClick);
      if (node) layer.add(node);
    });

    // Keep transformer and live stroke on top
    tr.moveToTop();
    if (liveStrokeRef.current) liveStrokeRef.current.moveToTop();

    // Re-attach transformer — multi-selection takes priority over single
    if (selectedIds?.length > 0 && drawTool === "select") {
      const nodes = selectedIds.map(id => layer.findOne("#" + id)).filter(Boolean);
      tr.nodes(nodes);
    } else if (selectedId && drawTool === "select") {
      const node = layer.findOne("#" + selectedId);
      tr.nodes(node ? [node] : []);
    } else {
      tr.nodes([]);
    }

    layer.batchDraw();
  }, [shapes, selectedId, selectedIds, drawTool, onChange, onSelect, handleTextDblClick]);

  /* ── Update cursor per draw tool ── */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.container().style.cursor = TOOL_CURSORS[drawTool] ?? "crosshair";
  }, [drawTool, stageRef]);

  return (
    <>
      <div
        ref={containerRef}
        style={{ display: "block", boxShadow: "0 4px 40px rgba(0,0,0,0.12)", borderRadius: 2 }}
      />
      {textEditing && (
        <TextEditOverlay editing={textEditing} onCommit={commitEdit} onCancel={cancelEdit} />
      )}
    </>
  );
}
