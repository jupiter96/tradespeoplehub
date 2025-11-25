import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
}

interface ShootingStar {
  id: number;
  x: number;
  y: number;
  angle: number;
  duration: number;
  delay: number;
}

export function StarryBackground() {
  const [stars, setStars] = useState<Star[]>([]);
  const [shootingStars, setShootingStars] = useState<ShootingStar[]>([]);

  // Generate static twinkling stars
  useEffect(() => {
    const generatedStars: Star[] = [];
    for (let i = 0; i < 100; i++) {
      generatedStars.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        delay: Math.random() * 3,
      });
    }
    setStars(generatedStars);
  }, []);

  // Generate shooting stars periodically
  useEffect(() => {
    const generateShootingStar = () => {
      // Generate new position
      const newX = Math.random() * 100;
      const newY = Math.random() * 30; // Start from top 30% of the area
      
      // Check if position is too close to existing shooting stars
      const minDistance = 20; // Minimum distance in percentage
      const isTooClose = shootingStars.some((star) => {
        const deltaX = Math.abs(star.x - newX);
        const deltaY = Math.abs(star.y - newY);
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        return distance < minDistance;
      });
      
      // Don't create if too close to existing stars
      if (isTooClose) {
        return;
      }
      
      const newStar: ShootingStar = {
        id: Date.now() + Math.random(), // Add random to ensure unique ID
        x: newX,
        y: newY,
        angle: Math.random() * 30 + 45, // 45-75 degrees (diagonal to vertical)
        duration: Math.random() * 0.8 + 0.6, // 0.6-1.4 seconds (faster)
        delay: 0,
      };
      
      setShootingStars((prev) => [...prev, newStar]);
      
      // Remove after animation completes
      setTimeout(() => {
        setShootingStars((prev) => prev.filter((star) => star.id !== newStar.id));
      }, (newStar.duration + newStar.delay) * 1000);
    };

    // Generate shooting stars at random intervals
    const interval = setInterval(() => {
      if (Math.random() > 0.3) { // 70% chance
        generateShootingStar();
      }
    }, 800);

    return () => clearInterval(interval);
  }, [shootingStars]);

  return (
    <div className="absolute top-0 left-0 right-0 h-[66%] overflow-hidden pointer-events-none z-[5]">
      {/* Twinkling Stars */}
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
          }}
          animate={{
            opacity: [0.2, 1, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: star.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Shooting Stars */}
      {shootingStars.map((shootingStar) => {
        // Calculate diagonal movement based on angle
        const distance = 300;
        const radians = (shootingStar.angle * Math.PI) / 180;
        const moveX = Math.cos(radians) * distance;
        const moveY = Math.sin(radians) * distance;
        
        return (
          <motion.div
            key={shootingStar.id}
            className="absolute"
            style={{
              left: `${shootingStar.x}%`,
              top: `${shootingStar.y}%`,
            }}
            initial={{ opacity: 0, x: 0, y: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              x: moveX,
              y: moveY,
            }}
            transition={{
              duration: shootingStar.duration,
              delay: shootingStar.delay,
              ease: "linear",
            }}
          >
            <div className="relative" style={{ rotate: `${shootingStar.angle + 180}deg` }}>
              {/* Shooting star head with sparkle effect */}
              <motion.div 
                className="w-[4px] h-[4px] bg-white rounded-full relative"
                style={{
                  boxShadow: '0 0 15px 3px rgba(255,255,255,0.9), 0 0 25px 5px rgba(255,255,255,0.6)',
                }}
                animate={{
                  scale: [1, 1.3, 1, 1.3, 1],
                  opacity: [1, 0.8, 1, 0.8, 1],
                }}
                transition={{
                  duration: 0.3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                {/* Sparkle cross effect */}
                <motion.div
                  className="absolute inset-0"
                  animate={{
                    rotate: [0, 90, 180, 270, 360],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <div className="absolute top-1/2 left-1/2 w-[12px] h-[1px] bg-white opacity-70" 
                       style={{ transform: 'translate(-50%, -50%)' }} />
                  <div className="absolute top-1/2 left-1/2 w-[1px] h-[12px] bg-white opacity-70" 
                       style={{ transform: 'translate(-50%, -50%)' }} />
                </motion.div>
              </motion.div>
              
              {/* Shooting star tail - longer and more vibrant */}
              <motion.div
                className="absolute top-[50%] left-[50%] w-[120px] h-[3px] bg-gradient-to-r from-white via-white/60 to-transparent rounded-full"
                style={{
                  transformOrigin: "left center",
                  transform: "translateX(-100%) translateY(-50%)",
                  boxShadow: '0 0 8px 2px rgba(255,255,255,0.5)',
                }}
                animate={{
                  opacity: [0, 0.9, 0.7, 0],
                  scaleX: [0.7, 1, 1, 0.8],
                }}
                transition={{
                  duration: shootingStar.duration,
                  ease: "linear",
                }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
