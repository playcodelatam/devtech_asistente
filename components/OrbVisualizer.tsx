import React from 'react';

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
  const orbSize = size === 'large' ? 'w-64 h-64' : 'w-32 h-32';
  const pulseSize = size === 'large' ? 'w-80 h-80' : 'w-40 h-40';

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer pulse rings - only when speaking */}
      {isActive && isSpeaking && (
        <>
          <div className={`absolute ${pulseSize} rounded-full bg-devtech-500/20 animate-ping`} 
               style={{ animationDuration: '2s' }} />
          <div className={`absolute ${pulseSize} rounded-full bg-devtech-500/10 animate-ping`} 
               style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
        </>
      )}
      
      {/* Main orb */}
      <div className={`relative ${orbSize} rounded-full transition-all duration-500 ${
        isActive 
          ? isSpeaking 
            ? 'bg-gradient-to-br from-devtech-400 via-devtech-500 to-devtech-600 shadow-2xl shadow-devtech-500/50' 
            : 'bg-gradient-to-br from-devtech-500 via-devtech-600 to-devtech-700 shadow-xl shadow-devtech-600/30'
          : 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 shadow-lg'
      }`}>
        {/* Inner glow */}
        <div className={`absolute inset-0 rounded-full transition-opacity duration-300 ${
          isActive && isSpeaking 
            ? 'opacity-100 animate-pulse' 
            : 'opacity-0'
        }`}
        style={{
          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent 50%)',
        }} />
        
        {/* Animated particles when speaking */}
        {isActive && isSpeaking && (
          <>
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div className="absolute w-2 h-2 bg-white/40 rounded-full animate-float-1" 
                   style={{ top: '20%', left: '30%' }} />
              <div className="absolute w-1.5 h-1.5 bg-white/30 rounded-full animate-float-2" 
                   style={{ top: '60%', left: '70%' }} />
              <div className="absolute w-2.5 h-2.5 bg-white/20 rounded-full animate-float-3" 
                   style={{ top: '40%', left: '50%' }} />
            </div>
          </>
        )}
        
        {/* Center highlight */}
        <div className={`absolute inset-0 rounded-full transition-all duration-500 ${
          isActive 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-50'
        }`}
        style={{
          background: 'radial-gradient(circle at center, rgba(255,255,255,0.2), transparent 60%)',
        }} />
      </div>

      {/* Breathing animation styles */}
      <style>{`
        @keyframes float-1 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
          50% { transform: translate(10px, -15px) scale(1.2); opacity: 0.8; }
        }
        @keyframes float-2 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          50% { transform: translate(-15px, 10px) scale(1.3); opacity: 0.7; }
        }
        @keyframes float-3 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.2; }
          50% { transform: translate(5px, 20px) scale(1.1); opacity: 0.6; }
        }
        .animate-float-1 { animation: float-1 3s ease-in-out infinite; }
        .animate-float-2 { animation: float-2 4s ease-in-out infinite; }
        .animate-float-3 { animation: float-3 3.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default OrbVisualizer;
