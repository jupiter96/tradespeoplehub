import { motion } from "motion/react";
import { Hammer, Wrench, Drill, Paintbrush, Scissors, Ruler, Lightbulb, Camera, Stethoscope, ShoppingBag } from "lucide-react";

export default function FloatingGraphicsBlue() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Hammer - Top Right */}
      <motion.div
        className="absolute top-12 right-20"
        animate={{
          y: [0, 25, 0],
          x: [0, 15, 0],
          rotate: [0, -15, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Hammer className="w-12 h-12 text-white/25" strokeWidth={1.5} />
      </motion.div>

      {/* Wrench - Bottom Left */}
      <motion.div
        className="absolute bottom-20 left-16"
        animate={{
          y: [0, -20, 0],
          x: [0, 12, 0],
          rotate: [0, 20, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Wrench className="w-14 h-14 text-[#FE8A0F]/20" strokeWidth={1.5} />
      </motion.div>

      {/* Drill - Top Left */}
      <motion.div
        className="absolute top-32 left-24"
        animate={{
          y: [0, -18, 0],
          x: [0, -10, 0],
          rotate: [0, 25, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Drill className="w-10 h-10 text-white/30" strokeWidth={1.5} />
      </motion.div>

      {/* Paintbrush - Middle Right */}
      <motion.div
        className="absolute top-1/2 right-32"
        animate={{
          y: [0, -22, 0],
          rotate: [0, -30, 0],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Paintbrush className="w-11 h-11 text-[#FE8A0F]/25" strokeWidth={1.5} />
      </motion.div>

      {/* Scissors - Middle Left */}
      <motion.div
        className="absolute top-1/3 left-32"
        animate={{
          y: [0, 20, 0],
          x: [0, -12, 0],
          rotate: [0, 15, 0],
        }}
        transition={{
          duration: 11,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Scissors className="w-10 h-10 text-white/28" strokeWidth={1.5} />
      </motion.div>

      {/* Ruler - Bottom Right */}
      <motion.div
        className="absolute bottom-32 right-24"
        animate={{
          y: [0, -15, 0],
          rotate: [0, -20, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Ruler className="w-12 h-12 text-white/25" strokeWidth={1.5} />
      </motion.div>

      {/* Lightbulb - Top Center */}
      <motion.div
        className="absolute top-20 right-1/3"
        animate={{
          y: [0, 18, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Lightbulb className="w-10 h-10 text-[#FE8A0F]/22" strokeWidth={1.5} />
      </motion.div>

      {/* Camera - Middle Center */}
      <motion.div
        className="absolute top-1/2 left-1/4"
        animate={{
          y: [0, -25, 0],
          x: [0, 15, 0],
        }}
        transition={{
          duration: 13,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Camera className="w-11 h-11 text-white/22" strokeWidth={1.5} />
      </motion.div>

      {/* Stethoscope - Bottom Center */}
      <motion.div
        className="absolute bottom-24 left-1/2"
        animate={{
          y: [0, -20, 0],
          rotate: [0, 18, 0],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Stethoscope className="w-10 h-10 text-[#FE8A0F]/18" strokeWidth={1.5} />
      </motion.div>

      {/* Shopping Bag - Top Right Quarter */}
      <motion.div
        className="absolute top-40 right-1/4"
        animate={{
          y: [0, 22, 0],
          x: [0, -10, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <ShoppingBag className="w-9 h-9 text-white/25" strokeWidth={1.5} />
      </motion.div>

      {/* Dot Pattern - Top */}
      <motion.div
        className="absolute top-12 right-1/4 flex gap-3"
        animate={{
          y: [0, 20, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="w-2 h-2 rounded-full bg-white/20" />
        <div className="w-2 h-2 rounded-full bg-white/20" />
        <div className="w-2 h-2 rounded-full bg-white/20" />
      </motion.div>

      {/* Dot Pattern - Bottom */}
      <motion.div
        className="absolute bottom-20 left-1/4 flex gap-3"
        animate={{
          y: [0, -15, 0],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      >
        <div className="w-2 h-2 rounded-full bg-[#FE8A0F]/20" />
        <div className="w-2 h-2 rounded-full bg-[#FE8A0F]/20" />
        <div className="w-2 h-2 rounded-full bg-[#FE8A0F]/20" />
      </motion.div>

      {/* Mini Dots Cluster - Top Right */}
      <motion.div
        className="absolute top-1/4 right-1/4"
        animate={{
          y: [0, 15, 0],
          x: [0, 10, 0],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
          </div>
          <div className="flex gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
          </div>
        </div>
      </motion.div>

      {/* Mini Dots Cluster - Bottom Left */}
      <motion.div
        className="absolute bottom-1/4 left-1/3"
        animate={{
          y: [0, -12, 0],
          x: [0, -8, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      >
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#FE8A0F]/30" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#FE8A0F]/30" />
          </div>
          <div className="flex gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#FE8A0F]/30" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#FE8A0F]/30" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
