interface TreeConnectorProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  colorTheme: {
    primary: string;
  };
  gradientId: string;
}

const TreeConnector = ({ startX, startY, endX, endY, colorTheme, gradientId }: TreeConnectorProps) => {
  // Create a curved path using quadratic bezier
  const midY = startY + (endY - startY) * 0.5;
  
  const pathD = `M ${startX} ${startY} Q ${startX} ${midY}, ${endX} ${endY}`;

  return (
    <>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colorTheme.primary} stopOpacity="0.8" />
          <stop offset="100%" stopColor={colorTheme.primary} stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <path
        d={pathD}
        stroke={`url(#${gradientId})`}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        className="transition-all duration-300"
      />
    </>
  );
};

export default TreeConnector;
