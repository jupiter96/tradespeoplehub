import imgEllipse9 from "figma:asset/d040e49e61f672a1133d6a29ffba1afdc3a08f8b.png";
import imgEllipse10 from "figma:asset/9b61b5d0d7f96707aca154f4962f012df96de602.png";
import imgEllipse11 from "figma:asset/c1e5f236e69ba84c123ce1336bb460f448af2762.png";
import imgEllipse12 from "figma:asset/6b183226d37cb39ef4f3b9151960d16140733b40.png";
import { motion } from "motion/react";

function Review() {
  return (
    <div className="absolute contents left-0 top-0" data-name="Review">
      {/* Avatar 1 */}
      <motion.div 
        className="absolute left-0 size-[42px] top-0"
        initial={{ opacity: 0, scale: 0, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          delay: 0.5,
          duration: 0.4,
          type: "spring",
          stiffness: 200,
          damping: 15
        }}
      >
        <img alt="" className="block max-w-none size-full" height="42" src={imgEllipse9} width="42" />
      </motion.div>

      {/* Avatar 2 - Fading */}
      <motion.div 
        className="absolute left-[35px] size-[42px] top-0"
        initial={{ opacity: 0, scale: 0, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          delay: 0.75,
          duration: 0.4,
          type: "spring",
          stiffness: 200,
          damping: 15
        }}
      >
        <motion.img 
          alt="" 
          className="block max-w-none size-full" 
          height="42" 
          src={imgEllipse10} 
          width="42"
          initial={{ opacity: 1 }}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{
            delay: 2.2,
            repeat: Infinity,
            duration: 2,
            ease: "easeInOut"
          }}
        />
      </motion.div>

      {/* Avatar 3 */}
      <motion.div 
        className="absolute left-[70px] size-[42px] top-0"
        initial={{ opacity: 0, scale: 0, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          delay: 1.0,
          duration: 0.4,
          type: "spring",
          stiffness: 200,
          damping: 15
        }}
      >
        <img alt="" className="block max-w-none size-full" height="42" src={imgEllipse11} width="42" />
      </motion.div>

      {/* Avatar 4 - Fading */}
      <motion.div 
        className="absolute left-[106px] size-[42px] top-0"
        initial={{ opacity: 0, scale: 0, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          delay: 1.25,
          duration: 0.4,
          type: "spring",
          stiffness: 200,
          damping: 15
        }}
      >
        <motion.img 
          alt="" 
          className="block max-w-none size-full" 
          height="42" 
          src={imgEllipse12} 
          width="42"
          initial={{ opacity: 1 }}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{
            delay: 2.2,
            repeat: Infinity,
            duration: 2,
            ease: "easeInOut",
            repeatDelay: 0.5
          }}
        />
      </motion.div>

      {/* Badge */}
      <motion.div 
        className="absolute left-[140px] size-[42px] top-0"
        initial={{ opacity: 0, scale: 0, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          delay: 1.5,
          duration: 0.4,
          type: "spring",
          stiffness: 200,
          damping: 15
        }}
      >
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 42 42">
          <circle cx="21" cy="21" fill="var(--fill-0, #FE8A0F)" id="Ellipse 13" r="20.5" stroke="var(--stroke-0, white)" />
        </svg>
      </motion.div>

      {/* Text */}
      <motion.p 
        className="absolute font-['Poppins:Bold',sans-serif] leading-[1.24] left-[150px] not-italic text-[14px] text-nowrap text-white top-[12px] whitespace-pre"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ 
          delay: 1.5,
          duration: 0.3
        }}
      >
        17 K
      </motion.p>
    </div>
  );
}

export default function Group() {
  return (
    <div className="relative size-full">
      <Review />
    </div>
  );
}