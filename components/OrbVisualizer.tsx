import React, { useEffect, useRef } from 'react';

interface OrbVisualizerProps {
  isActive: boolean;
  isSpeaking: boolean;
  size?: 'normal' | 'large';
}

const OrbVisualizer: React.FC<OrbVisualizerProps> = ({ 
  isActive, 
  isSpeaking,
  size = 'normal'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<any[]>([]);
  
  const orbSize = size === 'large' ? 256 : 128;
  const containerSize = size === 'large' ? 'w-64 h-64' : 'w-32 h-32';
  const pulseSize = size === 'large' ? 'w-80 h-80' : 'w-40 h-40';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = orbSize;
    canvas.height = orbSize;

    const centerX = orbSize / 2;
    const centerY = orbSize / 2;
    const radius = orbSize / 2.5;

    // Create particles
    const particleCount = size === 'large' ? 150 : 100;
    particlesRef.current = Array.from({ length: particleCount }, () => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * (0.7 + Math.random() * 0.3);
      
      return {
        theta,
        phi,
        r,
        baseR: r,
        speed: 0.001 + Math.random() * 0.002,
        size: 1 + Math.random() * 2,
        brightness: 0.5 + Math.random() * 0.5,
        color: Math.floor(Math.random() * 4), // 0: cyan, 1: blue, 2: purple, 3: pink
        pulseOffset: Math.random() * Math.PI * 2,
      };
    });

    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, orbSize, orbSize);
      time += 0.01;

      // Draw particles
      particlesRef.current.forEach((particle) => {
        // Rotate particle
        particle.theta += particle.speed;
        
        // Pulse effect when speaking
        const pulse = isSpeaking ? Math.sin(time * 3 + particle.pulseOffset) * 0.15 : 0;
        particle.r = particle.baseR * (1 + pulse);

        // Convert spherical to cartesian coordinates
        const x = centerX + particle.r * Math.sin(particle.phi) * Math.cos(particle.theta);
        const y = centerY + particle.r * Math.sin(particle.phi) * Math.sin(particle.theta);
        const z = particle.r * Math.cos(particle.phi);

        // Calculate depth for 3D effect
        const scale = (z + radius) / (radius * 2);
        const alpha = isActive ? particle.brightness * scale : 0.3 * scale;

        // Color based on particle type
        let color;
        switch (particle.color) {
          case 0: color = `rgba(6, 182, 212, ${alpha})`; break; // cyan
          case 1: color = `rgba(59, 130, 246, ${alpha})`; break; // blue
          case 2: color = `rgba(139, 92, 246, ${alpha})`; break; // purple
          case 3: color = `rgba(236, 72, 153, ${alpha})`; break; // pink
          default: color = `rgba(59, 130, 246, ${alpha})`;
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(x, y, particle.size * scale, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Add glow when active
        if (isActive && isSpeaking) {
          ctx.shadowBlur = 10 * scale;
          ctx.shadowColor = color;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [orbSize, isActive, isSpeaking, size]);

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer pulse rings - only when speaking */}
      {isActive && isSpeaking && (
        <>
          <div className={`absolute ${pulseSize} rounded-full bg-devtech-500/20 animate-ping`} 
               style={{ animationDuration: '2s' }} />
          <div className={`absolute ${pulseSize} rounded-full bg-purple-500/10 animate-ping`} 
               style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
        </>
      )}
      
      {/* 3D Particle Sphere Canvas */}
      <div className={`relative ${containerSize} rounded-full transition-all duration-500 overflow-hidden ${
        isActive 
          ? isSpeaking 
            ? 'shadow-2xl shadow-devtech-500/50' 
            : 'shadow-xl shadow-devtech-600/30'
          : 'shadow-lg'
      }`}
      style={{
        background: isActive 
          ? 'radial-gradient(circle at center, rgba(14, 165, 233, 0.2), rgba(59, 130, 246, 0.1), transparent)'
          : 'radial-gradient(circle at center, rgba(51, 65, 85, 0.3), rgba(15, 23, 42, 0.2), transparent)'
      }}>
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          style={{ width: '100%', height: '100%' }}
        />
        
        {/* Ambient glow overlay */}
        <div className={`absolute inset-0 rounded-full transition-opacity duration-500 pointer-events-none ${
          isActive ? 'opacity-100' : 'opacity-30'
        }`}
        style={{
          background: 'radial-gradient(circle at 40% 40%, rgba(255,255,255,0.15), transparent 60%)',
        }} />
      </div>
    </div>
  );
};

export default OrbVisualizer;
