import React from 'react';

export interface ServiceCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export interface AudioState {
  isPlaying: boolean;
  isListening: boolean;
  volumeLevel: number;
}

// Minimal types for Live API interaction based on usage
export interface LiveConfig {
  responseModalities: string[];
  speechConfig: {
    voiceConfig: {
      prebuiltVoiceConfig: {
        voiceName: string;
      };
    };
  };
  systemInstruction: string;
}