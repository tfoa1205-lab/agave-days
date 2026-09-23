const ANGLES = [0, 36, 72, 108, 144, 180, 216, 252, 288, 324];

export function PetalGlyph({
  size = 96,
  light = "#5C7A6E",
  dark = "#3E5A50",
  center = "#2B4038",
}: {
  size?: number;
  light?: string;
  dark?: string;
  center?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <g transform="translate(100,100)">
        {ANGLES.map((angle, i) => (
          <path
            key={angle}
            d="M0,-4 L9,-72 Q0,-88 -9,-72 Z"
            fill={i % 2 === 0 ? light : dark}
            transform={`rotate(${angle})`}
          />
        ))}
        <circle r={7} fill={center} />
      </g>
    </svg>
  );
}
