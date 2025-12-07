import React, { useEffect, useRef } from 'react';

interface OrbVisualizerProps {
  isActive: boolean;
  isSpeaking: boolean;
  size?: 'normal' | 'large';
}

interface Filament {
  points: { x: number; y: number; z: number; angle: number; radius: number }[];
  color: number;
  speed: number;
  turbulence: number;
  phase: number;
}

const OrbVisualizer: React.FC<OrbVisualizerProps> = ({ 
  isActive, 
  isSpeaking,
  size = 'normal'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const filamentsRef = useRef<Filament[]>([]);
  
  const orbSize = size === 'large' ? 256 : 128;
  const containerSize = size === 'large' ? 'w-64 h-64' : 'w-32 h-32';
  const pulseSize = size === 'large' ? 'w-80 h-80' : 'w-40 h-40';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = orbSize;
    canvas.height = orbSize;

    const centerX = orbSize / 2;
    const centerY = orbSize / 2;
    const radius = orbSize / 2.5;

    // Create flowing filaments
    const filamentCount = size === 'large' ? 25 : 18;
    filamentsRef.current = Array.from({ length: filamentCount }, () => {
      const pointCount = 40;
      const baseAngle = Math.random() * Math.PI * 2;
      const baseRadius = radius * (0.3 + Math.random() * 0.5);
      
      return {
        points: Array.from({ length: pointCount }, (_, i) => ({
          x: 0,
          y: 0,
          z: 0,
          angle: baseAngle + (i / pointCount) * Math.PI * 4,
          radius: baseRadius + Math.sin(i * 0.3) * radius * 0.2,
        })),
        color: Math.floor(Math.random() * 5), // 0-4 for color variety
        speed: 0.005 + Math.random() * 0.01,
        turbulence: Math.random(),
        phase: Math.random() * Math.PI * 2,
      };
    });

    let time = 0;

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, orbSize, orbSize);
      
      // Breathing pulse (slow in rest, fast when speaking)
      const breathSpeed = isSpeaking ? 0.08 : 0.02;
      const breathIntensity = isSpeaking ? 0.25 : 0.08;
      time += breathSpeed;
      
      const globalPulse = 1 + Math.sin(time) * breathIntensity;

      filamentsRef.current.forEach((filament) => {
        // Update filament phase
        filament.phase += filament.speed * (isSpeaking ? 3 : 1);
        
        // Turbulence when speaking
        const turbulence = isSpeaking 
          ? Math.sin(time * 5 + filament.turbulence * 10) * 0.3
          : Math.sin(time * 0.5 + filament.turbulence * 2) * 0.05;

        // Calculate fog cloud positions
        filament.points.forEach((point, i) => {
          // Spiral motion with turbulence
          const spiralAngle = point.angle + filament.phase;
          const spiralRadius = point.radius * globalPulse;
          
          // 3D rotation
          const rotY = spiralAngle + time * 0.3;
          const rotZ = Math.sin(time * 0.2 + i * 0.1) * 0.5;
          
          // Calculate 3D position
          point.x = spiralRadius * Math.cos(spiralAngle) * Math.cos(rotZ);
          point.y = spiralRadius * Math.sin(spiralAngle) + turbulence * radius * 0.3;
          point.z = spiralRadius * Math.sin(rotZ) * Math.cos(rotY);
        });

        // Color selection with iridescence
        let color;
        const colorPhase = (time + filament.color) % 5;
        
        if (colorPhase < 1) {
          color = { r: 6, g: 182, b: 212 }; // Cyan
        } else if (colorPhase < 2) {
          color = { r: 14, g: 165, b: 233 }; // Electric Blue
        } else if (colorPhase < 3) {
          color = { r: 59, g: 130, b: 246 }; // Cobalt Blue
        } else if (colorPhase < 4) {
          color = { r: 99, g: 102, b: 241 }; // Indigo
        } else {
          color = { r: 139, g: 92, b: 246 }; // Purple/Violet
        }

        // Draw fog clouds at each point
        filament.points.forEach((point, i) => {
          // Project to 2D with perspective
          const perspective = 1 + point.z / (radius * 2);
          const screenX = centerX + point.x * perspective;
          const screenY = centerY + point.y * perspective;
          
          // Fog size based on depth and state
          const fogSize = (isSpeaking ? 35 : 25) * perspective;
          const opacity = isActive ? (0.15 + perspective * 0.1) : 0.05;
          
          // Create radial gradient for fog
          const fogGradient = ctx.createRadialGradient(
            screenX, screenY, 0,
            screenX, screenY, fogSize
          );
          
          fogGradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`);
          fogGradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity * 0.5})`);
          fogGradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
          
          ctx.fillStyle = fogGradient;
          ctx.fillRect(screenX - fogSize, screenY - fogSize, fogSize * 2, fogSize * 2);
        });
      });

      // Central core glow
      const coreGlow = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, radius * 0.6
      );
      
      if (isActive) {
        if (isSpeaking) {
          coreGlow.addColorStop(0, 'rgba(14, 165, 233, 0.4)');
          coreGlow.addColorStop(0.5, 'rgba(59, 130, 246, 0.2)');
          coreGlow.addColorStop(1, 'rgba(139, 92, 246, 0)');
        } else {
          coreGlow.addColorStop(0, 'rgba(14, 165, 233, 0.2)');
          coreGlow.addColorStop(0.5, 'rgba(59, 130, 246, 0.1)');
          coreGlow.addColorStop(1, 'rgba(99, 102, 241, 0)');
        }
      } else {
        coreGlow.addColorStop(0, 'rgba(100, 116, 139, 0.15)');
        coreGlow.addColorStop(1, 'rgba(51, 65, 85, 0)');
      }
      
      ctx.fillStyle = coreGlow;
      ctx.fillRect(0, 0, orbSize, orbSize);

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
