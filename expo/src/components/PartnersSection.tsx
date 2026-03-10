import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

const partners = [
  { id: 1, logo: "/partner1.jpg", name: "Partner 1" },
  { id: 2, logo: "/partner2.webp", name: "Partner 2" },
  { id: 3, logo: "/partner3.webp", name: "Partner 3" },
  { id: 4, logo: "/partner4.webp", name: "Partner 4" },
  { id: 5, logo: "/partner5.webp", name: "Partner 5" },
  { id: 7, logo: "/partner7.webp", name: "Partner 7" },
  { id: 8, logo: "/partner8.webp", name: "Partner 8" },
];

export function PartnersSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationFrameId: number;
    let scrollPosition = 0;
    const scrollSpeed = 0.5;

    const animate = () => {
      scrollPosition += scrollSpeed;

      if (scrollPosition >= scrollContainer.scrollWidth / 2) {
        scrollPosition = 0;
      }

      scrollContainer.scrollLeft = scrollPosition;
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const duplicatedPartners = [...partners, ...partners, ...partners];

  return (
    <section id="partners" className="relative z-10 py-32 px-8 overflow-hidden bg-slate-50/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-4 mb-6"
          >
            <span className="w-12 h-[1px] bg-gradient-to-r from-transparent to-primary" />
            <span className="text-primary text-xs font-bold uppercase tracking-[0.3em]">
              Collaboration
            </span>
            <span className="w-12 h-[1px] bg-gradient-to-l from-transparent to-primary" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-display font-bold tracking-tight mb-6 text-gray-900"
          >
            OUR{" "}
            <span className="text-primary">
              PARTNERS
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-gray-600 text-lg font-light max-w-2xl mx-auto"
          >
            Trusted by leading organizations who share our vision
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />

          <div
            ref={scrollRef}
            className="flex gap-12 overflow-x-hidden py-12"
            style={{ scrollBehavior: "auto" }}
          >
            {duplicatedPartners.map((partner, index) => (
              <div
                key={`${partner.id}-${index}`}
                className="group relative flex-shrink-0 w-[280px] h-[160px] rounded-3xl bg-white border border-gray-100 hover:border-primary/30 shadow-sm transition-all duration-700 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                <div className="relative h-full flex items-center justify-center p-8">
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="max-w-full max-h-full object-contain filter grayscale group-hover:grayscale-0 opacity-80 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110"
                  />
                </div>

                <div className="absolute inset-0 rounded-3xl ring-1 ring-transparent group-hover:ring-primary/10 transition-all duration-700" />
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white border border-gray-100 shadow-sm">
            <div className="flex -space-x-2">
              {partners.slice(0, 4).map((partner, index) => (
                <div
                  key={partner.id}
                  className="w-8 h-8 rounded-full bg-white border-2 border-white overflow-hidden shadow-sm"
                  style={{ zIndex: partners.length - index }}
                >
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="w-full h-full object-cover filter grayscale opacity-60"
                  />
                </div>
              ))}
            </div>
            <span className="text-gray-500 text-sm font-light">
              <span className="text-gray-900 font-bold">{partners.length}+</span>{" "}
              Strategic Partners
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
