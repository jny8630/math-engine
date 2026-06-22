import type { Visual } from '../types';

// Lightweight SVG visuals used in walkthrough steps. Placeholder-level for v1
// — meant to convey the concept, not to be production-grade illustrations.

export function VisualSlot({ kind }: { kind: Visual }) {
  switch (kind) {
    case 'bar-model':
      return <BarModel />;
    case 'number-line':
      return <NumberLine />;
    case 'percent-grid':
      return <PercentGrid />;
  }
}

function BarModel() {
  // Generic divided-bar illustration — placeholder for fraction reasoning.
  return (
    <svg viewBox="0 0 200 30" role="img" aria-label="Bar model" class="visual">
      <rect x="0" y="0" width="200" height="30" fill="#eef" stroke="#88a" />
      {[50, 100, 150].map((x) => (
        <line key={x} x1={x} y1="0" x2={x} y2="30" stroke="#88a" />
      ))}
    </svg>
  );
}

function NumberLine() {
  return (
    <svg viewBox="0 0 200 30" role="img" aria-label="Number line" class="visual">
      <line x1="10" y1="20" x2="190" y2="20" stroke="#333" />
      {[10, 50, 90, 100, 110, 150, 190].map((x) => (
        <line key={x} x1={x} y1="15" x2={x} y2="25" stroke="#333" />
      ))}
      <text x="100" y="12" textAnchor="middle" fontSize="10" fill="#666">
        0
      </text>
    </svg>
  );
}

function PercentGrid() {
  // 10x10 grid; meant to be styled per-problem later. Currently shows the grid.
  const cells = [];
  for (let i = 0; i < 100; i++) {
    const x = (i % 10) * 10;
    const y = Math.floor(i / 10) * 10;
    cells.push(
      <rect key={i} x={x} y={y} width="9" height="9" fill="#eef" stroke="#88a" />,
    );
  }
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label="Percent grid" class="visual">
      {cells}
    </svg>
  );
}
