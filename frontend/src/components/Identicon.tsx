// Deterministic SVG identicon for anonymous pseudonyms.
// Simple hash-derived 5x5 mirrored grid.

export function Identicon({
  seed,
  size = 28,
}: {
  seed: string;
  size?: number;
}) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }

  const cells: boolean[] = [];
  for (let i = 0; i < 15; i++) {
    cells.push(Boolean((hash >> (i % 31)) & 1 ^ ((i * 7) % 2)));
  }

  // 5x5 grid with horizontal symmetry
  const grid: boolean[][] = [];
  for (let y = 0; y < 5; y++) {
    const row: boolean[] = [];
    const a = cells[y * 3 + 0] ?? false;
    const b = cells[y * 3 + 1] ?? false;
    const c = cells[y * 3 + 2] ?? false;
    row.push(a, b, c, b, a);
    grid.push(row);
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 5 5"
      className="shrink-0 bg-panel2 border border-line"
      aria-hidden="true"
    >
      {grid.map((row, y) =>
        row.map(
          (filled, x) =>
            filled && (
              <rect
                key={`${x}-${y}`}
                x={x}
                y={y}
                width={1}
                height={1}
                fill="#e4e4e7"
              />
            ),
        ),
      )}
    </svg>
  );
}