import React from 'react';
import { motion } from 'framer-motion';
import { useWebsiteContent } from '../utils/cms';
import chefStoryImg from '../assets/Maha Hot Pot (Seasonal).png';
import menuCurryImg from '../assets/Coconut Shell.png';

export default function PhilosophySection() {
  const content = useWebsiteContent();
  const { subtitle, title, paragraph1, paragraph2, pillar1Num, pillar1Text, pillar2Num, pillar2Text, pillar3Num, pillar3Text } = content.philosophy;
  const imageVariants = {
    hidden: { opacity: 0, x: -40, scale: 0.95 },
    visible: { 
      opacity: 1, 
      x: 0,
      scale: 1,
      transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } 
    }
  };

  const textVariants = {
    hidden: { opacity: 0, x: 40 },
    visible: { 
      opacity: 1, 
      x: 0, 
      transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } 
    }
  };

  return (
    <section 
      id="philosophy" 
      className="section-padding bg-white relative overflow-hidden"
      style={{ backgroundColor: 'var(--canvas-primary)', borderBottom: '1px solid var(--border-light)' }}
    >
      <div className="container">
        <div className="responsive-grid-12" style={{ gap: '4.5rem' }}>
          {/* Left Column: Redesigned Overlapping Food Images */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={imageVariants}
            className="lg-col-span-6 flex justify-center"
            style={{ display: 'flex', justifyContent: 'center' }}
          >
            <div className="philosophy-images-wrapper">
              {/* Offset Gold Border Frame */}
              <div className="philosophy-img-border" />
              
              {/* Back Image */}
              <img 
                src={chefStoryImg} 
                alt="Culinary Preparation" 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '75%',
                  height: '75%',
                  objectFit: 'cover',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-soft)',
                  zIndex: 1
                }}
              />

              {/* Front Image (overlapping) */}
              <img 
                src={menuCurryImg} 
                alt="Authentic Thai Curry" 
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: '75%',
                  height: '75%',
                  objectFit: 'cover',
                  borderRadius: '12px',
                  border: '6px solid var(--canvas-primary)',
                  boxShadow: 'var(--shadow-premium)',
                  zIndex: 2
                }}
              />
            </div>
          </motion.div>

          {/* Right Column: Copy & Horizontal Pillars */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={textVariants}
            className="lg-col-span-6 text-left"
            style={{ textAlign: 'left' }}
          >
            <span 
              className="block font-sans text-xs font-bold tracking-[0.3em] uppercase mb-4"
              style={{ color: 'var(--gold-antique)', display: 'block', fontSize: '0.75rem', letterSpacing: '0.3em', marginBottom: '1rem' }}
            >
              {subtitle}
            </span>
            
            <h2 
              className="font-serif text-4xl md:text-5xl font-light leading-tight mb-8"
              style={{ fontSize: 'clamp(2rem, 3.8vw, 3rem)', fontWeight: 300, lineHeight: 1.15, marginBottom: '1.5rem', color: 'var(--text-dark)' }}
            >
              {title}
            </h2>
            
            <p 
              className="font-sans text-base font-light text-muted mb-6 leading-relaxed"
              style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 300, marginBottom: '1.5rem' }}
            >
              {paragraph1}
            </p>

            <p 
              className="font-sans text-base font-light text-muted mb-8 leading-relaxed"
              style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 300, marginBottom: '2rem' }}
            >
              {paragraph2}
            </p>

            {/* Horizontal Pillars list */}
            <div className="philosophy-pillars">
              <div className="philosophy-pillar-item">
                <span className="philosophy-pillar-num">{pillar1Num}</span>
                <span className="philosophy-pillar-txt">{pillar1Text}</span>
              </div>
              <div className="philosophy-pillar-item">
                <span className="philosophy-pillar-num">{pillar2Num}</span>
                <span className="philosophy-pillar-txt">{pillar2Text}</span>
              </div>
              <div className="philosophy-pillar-item">
                <span className="philosophy-pillar-num">{pillar3Num}</span>
                <span className="philosophy-pillar-txt">{pillar3Text}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
