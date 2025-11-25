import { motion } from "motion/react";
import walkingPerson from "figma:asset/f7d2d5e8e4c1a88d1b083f490138959c69f83611.png";

export default function WalkingPersonAnimation() {
  return (
    <motion.div
      className="absolute bottom-0 left-[30%] w-[35%] pointer-events-none z-20"
      initial={{ x: "0%", opacity: 0 }}
      animate={{ 
        x: ["0%", "100%", "100%"],
        opacity: [0, 1, 1]
      }}
      transition={{
        duration: 3.5,
        times: [0, 0.85, 1],
        ease: "easeInOut",
      }}
    >
      <div className="relative w-[80px] md:w-[100px] h-[80px] md:h-[100px]">
        {/* 그림자 효과 */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-2 bg-black/20 rounded-full blur-sm"></div>
        
        {/* 걷는 사람 이미지 */}
        <img 
          src={walkingPerson} 
          alt="" 
          className="w-full h-full object-contain drop-shadow-lg"
        />
      </div>
    </motion.div>
  );
}
