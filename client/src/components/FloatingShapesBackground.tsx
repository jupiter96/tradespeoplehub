import { motion } from "motion/react";
import { Hammer, Wrench, Settings, Drill, Paintbrush, Ruler } from "lucide-react";

export default function FloatingShapesBackground() {
  // 2 shapes: circle and square - larger with blue/orange tones (outline)
  const shapes = [
    { type: 'circle', size: 100, color: '#003D82', left: '8%', top: '12%', duration: 12, delay: 0 },
    { type: 'square', size: 95, color: '#FE8A0F', left: '85%', top: '70%', duration: 13, delay: 1 },
  ];

  // 6 tool icons
  const tools = [
    { Icon: Hammer, size: 48, color: '#FE8A0F', left: '25%', top: '30%', duration: 10, delay: 0.5 },
    { Icon: Wrench, size: 52, color: '#003D82', left: '65%', top: '40%', duration: 12, delay: 1.5 },
    { Icon: Settings, size: 46, color: '#FF8C42', left: '45%', top: '15%', duration: 11, delay: 2.5 },
    { Icon: Drill, size: 50, color: '#0057B7', left: '88%', top: '35%', duration: 13, delay: 0 },
    { Icon: Paintbrush, size: 48, color: '#FE8A0F', left: '12%', top: '55%', duration: 10, delay: 3 },
    { Icon: Ruler, size: 54, color: '#2A5BA8', left: '55%', top: '80%', duration: 12, delay: 1 },
  ];

  const renderShape = (shape: typeof shapes[0], index: number) => {
    const baseClasses = "absolute";
    
    if (shape.type === 'circle') {
      return (
        <motion.div
          key={`shape-${index}`}
          className={baseClasses}
          style={{
            left: shape.left,
            top: shape.top,
            width: shape.size,
            height: shape.size,
            border: `5px solid ${shape.color}`,
            borderRadius: '50%',
            opacity: 0.3,
          }}
          animate={{
            y: [0, -50, 0],
            x: [0, 40, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: shape.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: shape.delay,
          }}
        />
      );
    }
    
    
    if (shape.type === 'square') {
      return (
        <motion.div
          key={`shape-${index}`}
          className={baseClasses}
          style={{
            left: shape.left,
            top: shape.top,
            width: shape.size,
            height: shape.size,
            border: `5px solid ${shape.color}`,
            borderRadius: '12px',
            opacity: 0.3,
          }}
          animate={{
            y: [0, -55, 0],
            x: [0, 35, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: shape.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: shape.delay,
          }}
        />
      );
    }
    
    return null;
  };

  const renderTool = (tool: typeof tools[0], index: number) => {
    const { Icon, size, color, left, top, duration, delay } = tool;
    
    return (
      <motion.div
        key={`tool-${index}`}
        className="absolute"
        style={{
          left,
          top,
        }}
        animate={{
          y: [0, -45, 0],
          x: [0, 30, 0],
          rotate: [0, 15, -15, 0],
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "easeInOut",
          delay,
        }}
      >
        <Icon 
          size={size} 
          color={color}
          strokeWidth={1.5}
          style={{ opacity: 0.25 }}
        />
      </motion.div>
    );
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {shapes.map((shape, index) => renderShape(shape, index))}
      {tools.map((tool, index) => renderTool(tool, index))}
    </div>
  );
}
