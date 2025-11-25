interface WhiteCircleProps {
  className?: string;
  size?: number;
}

export function WhiteCircle({ className = "", size = 45 }: WhiteCircleProps) {
  const radius = size / 2;
  
  return (
    <div className={className} style={{ width: size, height: size }}>
      <svg 
        className="block size-full" 
        fill="none" 
        preserveAspectRatio="none" 
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle 
          cx={radius} 
          cy={radius} 
          fill="var(--fill-0, white)" 
          id="Ellipse" 
          r={radius} 
        />
      </svg>
    </div>
  );
}
