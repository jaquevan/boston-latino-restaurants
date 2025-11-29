import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const SplashScreen = ({ onComplete }) => {
  const splashRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const circle1Ref = useRef(null);
  const circle2Ref = useRef(null);
  const circle3Ref = useRef(null);

  useEffect(() => {
    const timeline = gsap.timeline({
      onComplete: () => {
        setTimeout(onComplete, 300);
      }
    });

    // Animate circles
    timeline.fromTo(circle1Ref.current,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 0.4, duration: 1, ease: 'elastic.out(1, 0.5)' }
    );

    timeline.fromTo(circle2Ref.current,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 0.3, duration: 1, ease: 'elastic.out(1, 0.5)' },
      '-=0.8'
    );

    timeline.fromTo(circle3Ref.current,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 0.3, duration: 1, ease: 'elastic.out(1, 0.5)' },
      '-=0.8'
    );

    // Animate text
    timeline.fromTo(titleRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
      '-=0.5'
    );

    timeline.fromTo(subtitleRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
      '-=0.3'
    );

    // Fade out splash screen
    timeline.to(splashRef.current,
      { opacity: 0, duration: 0.5, ease: 'power2.inOut' },
      '+=0.8'
    );

  }, [onComplete]);

  return (
    <div
      ref={splashRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-horchata overflow-hidden"
    >
      {/* Decorative circles */}
      <div
        ref={circle1Ref}
        className="absolute top-20 right-20 w-64 h-64 rounded-full bg-chili"
        style={{ opacity: 0 }}
      />
      <div
        ref={circle2Ref}
        className="absolute bottom-32 left-16 w-48 h-48 rounded-full bg-maize"
        style={{ opacity: 0 }}
      />
      <div
        ref={circle3Ref}
        className="absolute top-1/3 left-1/4 w-32 h-32 rounded-full bg-nopal"
        style={{ opacity: 0 }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6">
        <h1
          ref={titleRef}
          className="text-6xl md:text-8xl font-bold text-chili mb-4"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          Sabor Latino
        </h1>
        <p
          ref={subtitleRef}
          className="text-2xl md:text-3xl text-terracotta font-light"
        >
          Boston's Latino Food Scene
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
