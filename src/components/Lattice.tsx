//@ts-nocheck
'use client';
import React from "react";

const nodes = [
  // Top layer
  { id: "audit", x: 400, y: 0, z: 100, label: "Audit Flow System", primary: true },
  
  // Middle layer
  { id: "cfr", x: 50, y: 180, z: 200, label: "Search CFR Codes" },
  { id: "annotations", x: 500, y: 150, z: 200, label: "Auditor Comments & Reports" },
  { id: "chatbot", x: 900, y: 80, z: 200, label: "CFR Chatbot", primary: true },
  { id: "autofill", x: 400, y: 220, z: 200, label: "Document Autofill" },
  
  // Lower middle layer
  { id: "custom_forms", x: 120, y: 300, z: 300, label: "Custom Forms & Evidence" },
  { id: "navigate", x: 520, y: 400, z: 300, label: "Navigate Regulations" },
  { id: "contextual", x: 800, y: 360, z: 300, label: "Get Contextual Guidance" },
  
  // Bottom layer
  { id: "warning_letters", x: 400, y: 750, z: 400, label: "Warning Letter Analysis", primary: true },
  { id: "compare", x: 100, y: 480, z: 400, label: "Compare Letters" },
  { id: "patterns", x: 400, y: 490, z: 400, label: "Track Violation Patterns" },
  { id: "similar_cases", x: 700, y: 480, z: 400, label: "Identify Similar Cases" }
];

const connections = [
  ["audit", "cfr"],
  ["audit", "custom_forms"],
  ["audit", "autofill"],
  ["audit", "annotations"],
  ["warning_letters", "compare"],
  ["warning_letters", "patterns"],
  ["warning_letters", "similar_cases"],
  ["chatbot", "navigate"],
  ["chatbot", "contextual"],
  ["autofill", "navigate"]
];

export default function ComplianceLattice() {
  const [hoveredNode, setHoveredNode] = React.useState(null);

  const getProjectedPosition = (x, y, z) => {
    const perspective = 2000;
    const scale = perspective / (perspective + z);
    return {
      x: x + (z * 0.15),
      y: y + (z * 0.05),
      scale
    };
  };

  return (
    <div className="relative w-full h-screen bg-blue-400/10 flex items-center justify-center">
      <svg className="w-[1200px] h-[700px]" viewBox="0 0 1200 700">
        {connections.map(([startId, endId], i) => {
          const start = nodes.find(n => n.id === startId);
          const end = nodes.find(n => n.id === endId);
          const startPos = getProjectedPosition(start.x, start.y, start.z);
          const endPos = getProjectedPosition(end.x, end.y, end.z);
          const isHighlighted = hoveredNode && (hoveredNode === startId || hoveredNode === endId);
          
          return (
            <line
              key={`connection-${i}`}
              x1={startPos.x}
              y1={startPos.y}
              x2={endPos.x}
              y2={endPos.y}
              stroke="#FFFFFF"
              strokeWidth={isHighlighted ? 3 : 2}
              opacity={isHighlighted ? 0.6 : 0.3}
              className="transition-all duration-300"
            />
          );
        })}

        {nodes.map((node) => {
          const pos = getProjectedPosition(node.x, node.y, node.z);
          const isHighlighted = hoveredNode === node.id;
          const radius = node.primary ? 28 : 22;
          
          return (
            <g
              key={node.id}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              className="cursor-pointer"
            >
              <circle
                cx={pos.x}
                cy={pos.y}
                r={radius}
                fill={node.primary ? "#000000" : "#FFFFFF"}
                stroke={isHighlighted ? "#FFFFFF" : "#000000"}
                strokeWidth={2}
                className="transition-all duration-300"
              />
              
              <text
                x={pos.x + radius + 15}
                y={pos.y + 5}
                fill="#FFFFFF"
                fontSize={18}
                fontWeight="bold"
                opacity={1}
                className="transition-all duration-300"
                style={{ textShadow: "0 2px 4px rgba(0,0,0,0.7)" }}
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}