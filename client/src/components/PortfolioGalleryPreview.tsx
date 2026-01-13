import React, { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";

interface PortfolioItem {
  id?: string;
  type?: 'image' | 'video';
  url?: string;
  image?: string;
  title?: string;
  description?: string;
}

interface PortfolioGalleryPreviewProps {
  items: PortfolioItem[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
}

export default function PortfolioGalleryPreview({
  items,
  initialIndex = 0,
  open,
  onClose,
}: PortfolioGalleryPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, open]);

  // Reset zoom when item changes
  useEffect(() => {
    setImageScale(1);
    setImagePosition({ x: 0, y: 0 });
  }, [currentIndex]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  }, [items.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  }, [items.length]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handlePrevious, handleNext, onClose]);

  if (!items || items.length === 0) return null;

  const currentItem = items[currentIndex];
  if (!currentItem) return null;

  // Resolve media URL
  const rawUrl = currentItem.url || currentItem.image;
  const itemUrl = rawUrl && !rawUrl.startsWith('http') && rawUrl.startsWith('/') 
    ? `${window.location.origin.includes('localhost') ? 'http://localhost:5000' : window.location.origin}${rawUrl}` 
    : rawUrl;

  const isVideo = currentItem.type === 'video';

  return (
    <AnimatePresence>
      {open && (
        <motion.div 
          className="fixed inset-0 z-[9999]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {/* Background overlay with dark blur effect - clickable to close */}
          <motion.div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Close Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.2 }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute top-6 right-6 z-[10000] bg-black/60 hover:bg-black/80 text-white rounded-full w-14 h-14 transition-all duration-200 hover:scale-110 shadow-lg"
              aria-label="Close gallery"
            >
              <X className="w-6 h-6" />
            </Button>
          </motion.div>

          {/* Navigation Buttons */}
          {items.length > 1 && (
            <>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, duration: 0.2 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevious}
                  className="absolute left-6 top-1/2 -translate-y-1/2 z-[10000] bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full w-16 h-16 transition-all duration-200 hover:scale-110 border border-white/20"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, duration: 0.2 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNext}
                  className="absolute right-6 top-1/2 -translate-y-1/2 z-[10000] bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full w-16 h-16 transition-all duration-200 hover:scale-110 border border-white/20"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>
              </motion.div>
            </>
          )}

          {/* Media Container */}
          <div className="absolute inset-0 flex items-center justify-center p-4 md:p-6 overflow-hidden pointer-events-none">
            <motion.div 
              className="relative w-full h-full flex items-center justify-center pointer-events-auto"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              key={currentIndex}
            >
              {isVideo ? (
                <video
                  src={itemUrl}
                  className="max-w-[90%] max-h-[90%] object-contain rounded-lg shadow-2xl"
                  controls
                  autoPlay
                  playsInline
                />
              ) : (
                <img
                  src={itemUrl}
                  alt={currentItem.title || 'Portfolio item'}
                  className="max-w-[90%] max-h-[90%] object-contain rounded-lg shadow-2xl cursor-zoom-in"
                  style={{
                    transform: `scale(${imageScale}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                    transformOrigin: 'center center',
                    transition: imageScale === 1 ? 'transform 0.3s ease' : 'none',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (imageScale === 1) {
                      setImageScale(2);
                    } else {
                      setImageScale(1);
                      setImagePosition({ x: 0, y: 0 });
                    }
                  }}
                  onWheel={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const delta = e.deltaY > 0 ? -0.1 : 0.1;
                    const newScale = Math.max(1, Math.min(3, imageScale + delta));
                    setImageScale(newScale);
                    if (newScale === 1) {
                      setImagePosition({ x: 0, y: 0 });
                    }
                  }}
                />
              )}
            </motion.div>
          </div>

          {/* Info Panel */}
          {(currentItem.title || currentItem.description) && (
            <motion.div 
              className="absolute bottom-0 left-0 right-0 p-6 md:p-8 pt-20 pb-8 pointer-events-none"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3, ease: "easeOut" }}
            >
              <div 
                className="relative max-w-5xl mx-auto pointer-events-auto rounded-2xl p-6 md:p-8 shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 61, 130, 0.75) 0%, rgba(61, 120, 203, 0.65) 30%, rgba(91, 146, 229, 0.55) 60%, rgba(255, 255, 255, 0.15) 100%)',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 8px 32px rgba(0, 61, 130, 0.3)',
                }}
              >
                {currentItem.title && (
                  <h3 
                    className="font-['Poppins',sans-serif] text-[28px] md:text-[36px] font-bold text-white mb-3"
                    style={{
                      textShadow: '0 2px 10px rgba(0, 0, 0, 0.6), 0 4px 20px rgba(0, 61, 130, 0.5), 0 0 40px rgba(0, 0, 0, 0.4)',
                      WebkitTextStroke: '0.5px rgba(255, 255, 255, 0.3)',
                    }}
                  >
                    {currentItem.title}
                  </h3>
                )}
                {currentItem.description && (
                  <p 
                    className="font-['Poppins',sans-serif] text-[16px] md:text-[18px] text-white leading-relaxed"
                    style={{
                      textShadow: '0 1px 6px rgba(0, 0, 0, 0.6), 0 2px 12px rgba(0, 61, 130, 0.4), 0 0 20px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    {currentItem.description}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Indicator */}
          {items.length > 1 && (
            <motion.div 
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[10000] pointer-events-none"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.3, ease: "easeOut" }}
            >
              <div className="bg-white/15 backdrop-blur-md rounded-full px-6 py-3 border border-white/20 shadow-xl">
                <span className="font-['Poppins',sans-serif] text-[15px] font-medium text-white">
                  {currentIndex + 1} / {items.length}
                </span>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
