import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const heroImages = [
  "/hero1.jpg",
  "/hero2.jpg",
  "/hero3.jpg",
  "/hero4.jpg",
  "/hero5.jpg",
  "/hero6.jpg",
  "/hero7.jpg",
  "/hero8.jpg",
  "/hero9.jpg",
  "/hero10.jpg",
  "/hero11.jpg",
];

export function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{
            duration: 1.5,
            ease: [0.43, 0.13, 0.23, 0.96],
          }}
          className="absolute inset-0 w-full h-full"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black z-10" />

          <motion.img
            src={heroImages[currentIndex]}
            alt={`Hero ${currentIndex + 1}`}
            className="w-full h-full object-cover"
            initial={{ scale: 1 }}
            animate={{ scale: 1.05 }}
            transition={{
              duration: 5,
              ease: "linear",
            }}
          />
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-8 right-8 z-20 flex gap-2">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className="group relative"
            aria-label={`Go to slide ${index + 1}`}
          >
            <div
              className={`h-1 rounded-full transition-all duration-500 ${
                index === currentIndex
                  ? "w-12 bg-white"
                  : "w-8 bg-white/30 group-hover:bg-white/50"
              }`}
            />
            {index === currentIndex && (
              <motion.div
                layoutId="activeSlide"
                className="absolute inset-0 h-1 bg-gradient-to-r from-purple-400 to-orange-400 rounded-full"
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
