"use client";

import { useState, useEffect } from "react";


export function MatrixRain() {
  const [columns, setColumns] = useState<{ left: number; delay: number; duration: number; chars: string }[]>([]);

  useEffect(() => {
    const chars = "01アイウエオカキクケコサシスセソタチツテトナニヌネノCIA";
    const cols = [];
    for (let i = 0; i < 30; i++) {
      const charStr = Array(20)
        .fill(0)
        .map(() => chars[Math.floor(Math.random() * chars.length)])
        .join("\n");
      cols.push({
        left: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 5 + Math.random() * 10,
        chars: charStr,
      });
    }
    setColumns(cols);
  }, []);

  return (
    <div className="matrix-bg">
      {columns.map((col, i) => (
        <div
          key={i}
          className="matrix-column"
          style={{
            left: `${col.left}%`,
            animationDelay: `${col.delay}s`,
            animationDuration: `${col.duration}s`,
          }}
        >
          {col.chars}
        </div>
      ))}
      <div className="scan-line" />
    </div>
  );
}