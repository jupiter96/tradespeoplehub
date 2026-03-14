import { useMemo, memo } from "react";
import { motion } from "motion/react";
import { 
  Wrench, 
  Hammer, 
  Paintbrush, 
  Drill,
  Scissors,
  Ruler,
  Brush,
  Lightbulb,
  Settings,
  Cog,
  Monitor,
  Laptop,
  Smartphone,
  Mail,
  MessageSquare,
  Camera,
  Video,
  Music,
  Wifi,
  Database,
  Cloud,
  Code,
  FileText,
  Calendar,
  Clock,
  BarChart,
  TrendingUp,
  Users,
  Heart,
  Star,
  Shield,
  Zap,
  Palette,
  Megaphone,
  ShoppingCart,
  Briefcase
} from "lucide-react";

// Orange and Light Blue color palette - matching other pages
const colors = [
  "#FE8A0F", // Orange
  "#FFB347", // Light Orange
  "#FF9933", // Tangerine
  "#FFA500", // Orange
  "#FF8C00", // Dark Orange
  "#60A5FA", // Light Blue
  "#93C5FD", // Sky Blue
  "#BFDBFE", // Lighter Blue
  "#3B82F6", // Blue
  "#0EA5E9", // Cyan Blue
];

// All kinds of professional service tools
const toolIcons = [
  Wrench, Hammer, Paintbrush, Drill, Scissors, Ruler, Brush, Lightbulb, Settings, Cog,
  Monitor, Laptop, Smartphone, Mail, MessageSquare, Camera, Video, Music, Wifi, Database,
  Cloud, Code, FileText, Calendar, Clock, BarChart, TrendingUp, Users, Heart, Star,
  Shield, Zap, Palette, Megaphone, ShoppingCart, Briefcase
];

// Shuffle function to randomize colors
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
  }
  return shuffled;
};

// Create tools with randomized colors
const shuffledColors = shuffleArray(colors);
const tools = toolIcons.map((Icon, index) => ({
  Icon,
  color: shuffledColors[index % shuffledColors.length],
  delay: (index * 0.5) % 5,
}));

interface FloatingTool {
  Icon: any;
  color: string;
  delay: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  mid1X: number;
  mid1Y: number;
  mid2X: number;
  mid2Y: number;
  duration: number;
  size: number;
}

const generateRandomPath = (): FloatingTool[] => {
  return tools.map((tool) => {
    const generateX = () => {
      const rand = Math.random();
      if (rand < 0.5) return Math.random() * 35;
      return 65 + Math.random() * 35;
    };
    const startX = generateX();
    const startY = Math.random() * 100;
    const endX = generateX();
    const endY = Math.random() * 100;
    const mid1X = (startX + endX) / 2 + (Math.random() - 0.5) * 15;
    const mid1Y = (startY + endY) / 2 + (Math.random() - 0.5) * 30;
    const mid2X = (endX + startX) / 2 + (Math.random() - 0.5) * 15;
    const mid2Y = (endY + startY) / 2 + (Math.random() - 0.5) * 30;
    return {
      ...tool,
      startX,
      startY,
      endX,
      endY,
      mid1X,
      mid1Y,
      mid2X,
      mid2Y,
      duration: 20 + Math.random() * 15,
      size: 24 + Math.random() * 28,
    };
  });
};

interface FloatingToolsBackgroundInnerProps {
  contained?: boolean;
}

function FloatingToolsBackgroundInner({ contained }: FloatingToolsBackgroundInnerProps) {
  const floatingTools = useMemo(() => generateRandomPath(), []);

  return (
    <div
      className={
        contained
          ? "absolute inset-0 overflow-hidden pointer-events-none"
          : "fixed inset-0 overflow-hidden pointer-events-none z-0"
      }
    >
      {floatingTools.map((tool, index) => {
        const { Icon, color, delay, startX, startY, endX, endY, mid1X, mid1Y, mid2X, mid2Y, duration, size } = tool;

        return (
          <motion.div
            key={index}
            className="absolute"
            initial={{
              left: `${startX}%`,
              top: `${startY}%`,
              opacity: 0,
              rotate: 0,
              scale: 0.8,
            }}
            animate={{
              left: [`${startX}%`, `${mid1X}%`, `${endX}%`, `${mid2X}%`, `${startX}%`],
              top: [`${startY}%`, `${mid1Y}%`, `${endY}%`, `${mid2Y}%`, `${startY}%`],
              opacity: [0, 0.3, 0.4, 0.35, 0],
              rotate: [0, 180, 360, 540, 720],
              scale: [0.8, 1, 0.9, 1.1, 0.8],
            }}
            transition={{
              duration: duration,
              delay: delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Icon
              size={size}
              color={color}
              strokeWidth={1.5}
              className="drop-shadow-sm"
            />
          </motion.div>
        );
      })}
    </div>
  );
}

interface FloatingToolsBackgroundProps {
  contained?: boolean;
}

const FloatingToolsBackground = memo(function FloatingToolsBackground({ contained }: FloatingToolsBackgroundProps) {
  return <FloatingToolsBackgroundInner contained={contained} />;
});
export default FloatingToolsBackground;
