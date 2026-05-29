"use client";
import React, { useRef, useEffect, useState, useCallback } from "react";

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
      node.on("dblclick dbltap", (e) => { e.cancelBubble = true; onTextDblClick(shape); });
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
    node.on("click tap", (e) => { e.cancelBubble = true; onSelect(shape.id); });
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
  onSelect,
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
  const containerRef  = useRef(null);
  const layerRef      = useRef(null);
  const bgLayerRef    = useRef(null);   // separate layer for bg rect (so destination-out works)
  const trRef         = useRef(null);
  const bgRef         = useRef(null);
  const KRef          = useRef(null);   // Konva module, set after dynamic import
  const liveStrokeRef = useRef(null);   // the in-progress drawing Line node

  // Keep latest values in refs so event handlers (set up once) see current values
  const drawToolRef   = useRef(drawTool);
  const brushColorRef = useRef(brushColor);
  const brushSizeRef  = useRef(brushSize);
  const bgColorRef    = useRef(bgColor);
  const onSelectRef   = useRef(onSelect);
  const onChangeRef   = useRef(onChange);

  useEffect(() => { drawToolRef.current   = drawTool;   }, [drawTool]);
  useEffect(() => { brushColorRef.current = brushColor; }, [brushColor]);
  useEffect(() => { brushSizeRef.current  = brushSize;  }, [brushSize]);
  useEffect(() => { bgColorRef.current    = bgColor;    }, [bgColor]);
  useEffect(() => { onSelectRef.current   = onSelect;   }, [onSelect]);
  useEffect(() => { onChangeRef.current   = onChange;   }, [onChange]);

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

  /* ── Initialize Stage (runs once on mount) ── */
  useEffect(() => {
    if (!containerRef.current || typeof window === "undefined") return;
    let cancelled = false;

    import("konva").then((mod) => {
      if (cancelled) return;
      const K = mod.default ?? mod;
      KRef.current = K;

      const stage   = new K.Stage({ container: containerRef.current, width: pageW, height: pageH });
      const bgLayer = new K.Layer({ listening: false });  // bg only — never intercepts events
      const layer   = new K.Layer();
      stage.add(bgLayer);
      stage.add(layer);

      const bg = new K.Rect({ width: pageW, height: pageH, fill: bgColor, listening: false, attrs: { isBackground: true } });
      bgLayer.add(bg);
      bgLayerRef.current = bgLayer;

      const tr = new K.Transformer({
        rotateEnabled: true,
        boundBoxFunc: (old, nw) => Math.abs(nw.width) < 5 || Math.abs(nw.height) < 5 ? old : nw,
      });
      layer.add(tr);

      stageRef.current = stage;
      layerRef.current = layer;
      trRef.current    = tr;
      bgRef.current    = bg;

      /* Pointer events — drawing & selection */
      stage.on("mousedown touchstart", (e) => {
        const tool = drawToolRef.current;
        if (tool === "select") {
          if (e.target === stage || e.target.attrs?.isBackground) onSelectRef.current(null);
          return;
        }
        const pos = stage.getPointerPosition();
        if (!pos) return;
        const isEraser = tool === "eraser";
        const newLine = {
          id:        `d${Date.now()}`,
          type:      "drawing",
          x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1,
          points:    [pos.x, pos.y],
          drawColor: isEraser ? "#000000" : brushColorRef.current,
          drawWidth: isEraser             ? brushSizeRef.current * 5
                   : tool === "brush"     ? Math.round(brushSizeRef.current * 2.5)
                   :                       brushSizeRef.current,
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

      stage.on("mousemove touchmove", () => {
        const ln = liveStrokeRef.current;
        if (!ln || drawToolRef.current === "select") return;
        const pos = stage.getPointerPosition();
        if (!pos) return;
        const pts = ln.points().concat([pos.x, pos.y]);
        ln.points(pts);
        layer.batchDraw();
      });

      stage.on("mouseup touchend", () => {
        const ln = liveStrokeRef.current;
        if (!ln) return;
        const pts = ln.points();
        ln.destroy();
        liveStrokeRef.current = null;
        layer.batchDraw();

        setDrawingLine(prev => {
          if (prev && pts.length > 4) {
            const finished = { ...prev, points: pts };
            setShapes(s => [...s, finished]);
            dirty.current = true;
          }
          return null;
        });
      });

      layer.batchDraw();
    });

    return () => {
      cancelled = true;
      stageRef.current?.destroy();
      stageRef.current  = null;
      layerRef.current  = null;
      bgLayerRef.current = null;
      trRef.current     = null;
      bgRef.current     = null;
      KRef.current      = null;
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

    // Re-attach transformer to selected node
    if (selectedId && drawTool === "select") {
      const node = layer.findOne("#" + selectedId);
      tr.nodes(node ? [node] : []);
    } else {
      tr.nodes([]);
    }

    layer.batchDraw();
  }, [shapes, selectedId, drawTool, onChange, onSelect, handleTextDblClick]);

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
