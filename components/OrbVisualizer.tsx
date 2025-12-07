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
          <div className={`absolute ${pulseSize} rounded-full bg-purple-500/10 animate-ping`} 
               style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
        </>
      )}
      
      {/* Main orb */}
      <div className={`relative ${orbSize} rounded-full transition-all duration-500 overflow-hidden ${
        isActive 
          ? isSpeaking 
            ? 'shadow-2xl shadow-devtech-500/50' 
            : 'shadow-xl shadow-devtech-600/30'
          : 'shadow-lg'
      }`}
      style={{
        background: isActive 
          ? 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #8b5cf6 100%)'
          : 'linear-gradient(135deg, #334155 0%, #1e293b 50%, #0f172a 100%)'
      }}>
        
        {/* Animated fog/mist layers - only when speaking */}
        {isActive && isSpeaking && (
          <>
            {/* Fog layer 1 - cyan to blue */}
            <div className="absolute inset-0 rounded-full animate-fog-1 opacity-60"
                 style={{
                   background: 'radial-gradient(circle at 30% 40%, rgba(6, 182, 212, 0.6), rgba(59, 130, 246, 0.4), transparent 70%)',
                   filter: 'blur(20px)',
                 }} />
            
            {/* Fog layer 2 - blue to purple */}
            <div className="absolute inset-0 rounded-full animate-fog-2 opacity-50"
                 style={{
                   background: 'radial-gradient(circle at 70% 60%, rgba(59, 130, 246, 0.5), rgba(139, 92, 246, 0.4), transparent 70%)',
                   filter: 'blur(25px)',
                 }} />
            
            {/* Fog layer 3 - purple to pink */}
            <div className="absolute inset-0 rounded-full animate-fog-3 opacity-40"
                 style={{
                   background: 'radial-gradient(circle at 50% 30%, rgba(139, 92, 246, 0.4), rgba(168, 85, 247, 0.3), transparent 70%)',
                   filter: 'blur(30px)',
                 }} />
            
            {/* Fog layer 4 - pink accent */}
            <div className="absolute inset-0 rounded-full animate-fog-4 opacity-30"
                 style={{
                   background: 'radial-gradient(circle at 40% 70%, rgba(236, 72, 153, 0.3), rgba(139, 92, 246, 0.2), transparent 70%)',
                   filter: 'blur(35px)',
                 }} />
          </>
        )}
        
        {/* Inner glow */}
        <div className={`absolute inset-0 rounded-full transition-opacity duration-300 ${
          isActive && isSpeaking 
            ? 'opacity-100 animate-pulse' 
            : 'opacity-0'
        }`}
        style={{
          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 50%)',
        }} />
        
        {/* Animated particles when speaking */}
        {isActive && isSpeaking && (
          <>
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div className="absolute w-2 h-2 bg-cyan-300/60 rounded-full animate-float-1 blur-sm" 
                   style={{ top: '20%', left: '30%' }} />
              <div className="absolute w-1.5 h-1.5 bg-blue-300/50 rounded-full animate-float-2 blur-sm" 
                   style={{ top: '60%', left: '70%' }} />
              <div className="absolute w-2.5 h-2.5 bg-purple-300/40 rounded-full animate-float-3 blur-sm" 
                   style={{ top: '40%', left: '50%' }} />
              <div className="absolute w-2 h-2 bg-pink-300/50 rounded-full animate-float-4 blur-sm" 
                   style={{ top: '70%', left: '40%' }} />
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
          background: 'radial-gradient(circle at center, rgba(255,255,255,0.3), transparent 60%)',
        }} />
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes fog-1 {
          0%, 100% { 
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 0.6;
          }
          33% { 
            transform: translate(15%, -10%) scale(1.1) rotate(120deg);
            opacity: 0.8;
          }
          66% { 
            transform: translate(-10%, 15%) scale(0.9) rotate(240deg);
            opacity: 0.5;
          }
        }
        
        @keyframes fog-2 {
          0%, 100% { 
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 0.5;
          }
          33% { 
            transform: translate(-15%, 10%) scale(1.15) rotate(-120deg);
            opacity: 0.7;
          }
          66% { 
            transform: translate(10%, -15%) scale(0.95) rotate(-240deg);
            opacity: 0.4;
          }
        }
        
        @keyframes fog-3 {
          0%, 100% { 
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 0.4;
          }
          33% { 
            transform: translate(10%, 15%) scale(1.2) rotate(90deg);
            opacity: 0.6;
          }
          66% { 
            transform: translate(-15%, -10%) scale(0.85) rotate(180deg);
            opacity: 0.3;
          }
        }
        
        @keyframes fog-4 {
          0%, 100% { 
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 0.3;
          }
          33% { 
            transform: translate(-10%, -15%) scale(1.1) rotate(-90deg);
            opacity: 0.5;
          }
          66% { 
            transform: translate(15%, 10%) scale(0.9) rotate(-180deg);
            opacity: 0.2;
          }
        }
        
        @keyframes float-1 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.6; }
          50% { transform: translate(10px, -15px) scale(1.3); opacity: 1; }
        }
        @keyframes float-2 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
          50% { transform: translate(-15px, 10px) scale(1.4); opacity: 0.9; }
        }
        @keyframes float-3 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
          50% { transform: translate(5px, 20px) scale(1.2); opacity: 0.8; }
        }
        @keyframes float-4 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
          50% { transform: translate(-10px, -10px) scale(1.3); opacity: 0.9; }
        }
        
        .animate-fog-1 { animation: fog-1 8s ease-in-out infinite; }
        .animate-fog-2 { animation: fog-2 10s ease-in-out infinite; }
        .animate-fog-3 { animation: fog-3 12s ease-in-out infinite; }
        .animate-fog-4 { animation: fog-4 9s ease-in-out infinite; }
        
        .animate-float-1 { animation: float-1 3s ease-in-out infinite; }
        .animate-float-2 { animation: float-2 4s ease-in-out infinite; }
        .animate-float-3 { animation: float-3 3.5s ease-in-out infinite; }
        .animate-float-4 { animation: float-4 4.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default OrbVisualizer;
