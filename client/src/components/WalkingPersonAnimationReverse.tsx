import { motion } from "framer-motion";
import walkingPersonReverse from "figma:asset/894ea1b27a77c9b8a7866c73c9d44608bbac6d8a.png";

export default function WalkingPersonAnimationReverse() {
  return (
    <motion.div
      className="absolute bottom-0 left-[65%] w-[35%] pointer-events-none z-20"
      initial={{ x: "0%", opacity: 0 }}
      animate={{ 
        x: ["0%", "0%", "-100%", "-100%"],
        opacity: [0, 0, 1, 1]
      }}
      transition={{
        duration: 7,
        times: [0, 0.5, 0.85, 1],
        ease: "easeInOut",
      }}
    >
      <div className="relative w-[80px] md:w-[100px] h-[80px] md:h-[100px]">
        {/* Shadow effect */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-2 bg-black/20 rounded-full blur-sm"></div>
        
        {/* Walking person image (reverse direction) */}
        <img 
          src={walkingPersonReverse} 
          alt="" 
          className="w-full h-full object-contain drop-shadow-lg"
        />
      </div>
    </motion.div>
  );
}
