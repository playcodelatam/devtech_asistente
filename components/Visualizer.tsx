import React from 'react';

interface VisualizerProps {
  isActive: boolean;
  isSpeaking: boolean; // Is the AI speaking?
}

const Visualizer: React.FC<VisualizerProps> = ({ isActive, isSpeaking }) => {
  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={`w-2 rounded-full transition-all duration-300 ${
            isActive 
              ? isSpeaking 
                ? 'bg-emerald-400 animate-wave' 
                : 'bg-devtech-500 animate-pulse'
              : 'bg-slate-700 h-2'
          }`}
          style={{
            height: isActive ? (isSpeaking ? '32px' : '16px') : '8px',
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
    </div>
  );
};

export default Visualizer;