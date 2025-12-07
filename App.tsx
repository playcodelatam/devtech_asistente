import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, Server, Users, Bot, StopCircle, CheckCircle2, Terminal } from 'lucide-react';
import { SYSTEM_INSTRUCTION, MODEL_NAME, VOICE_NAME } from './constants';
import { createPcmBlob, base64ToBytes, decodeAudioData } from './utils/audioUtils';
import Visualizer from './components/Visualizer';

const App: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // Refs for audio handling to avoid re-renders
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-4), msg]);
  };

  const cleanupAudio = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (inputSourceRef.current) {
      inputSourceRef.current.disconnect();
      inputSourceRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    activeSourcesRef.current.forEach(source => source.stop());
    activeSourcesRef.current.clear();
    setAiSpeaking(false);
  }, []);

  const connectToLive = async () => {
    setError(null);
    addLog("Inicializando conexión...");

    try {
      // 1. Setup Audio Contexts
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      inputAudioContextRef.current = new AudioContextClass({ sampleRate: 16000 });
      outputAudioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
      
      outputNodeRef.current = outputAudioContextRef.current.createGain();
      outputNodeRef.current.connect(outputAudioContextRef.current.destination);

      // 2. Get Microphone Stream
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      addLog("Micrófono accedido correctamente.");

      // 3. Initialize Gemini Client
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      // 4. Connect to Live Session
      const sessionPromise = ai.live.connect({
        model: MODEL_NAME,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE_NAME } },
          },
          systemInstruction: SYSTEM_INSTRUCTION,
        },
        callbacks: {
          onopen: () => {
            addLog("Sesión de DevTech conectada.");
            setIsConnected(true);
            
            // Start streaming input audio
            if (!inputAudioContextRef.current || !mediaStreamRef.current) return;

            inputSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
            processorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);

            processorRef.current.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              
              // Send to Gemini
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            inputSourceRef.current.connect(processorRef.current);
            processorRef.current.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Interruption
            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
                addLog("Interrupción detectada.");
                activeSourcesRef.current.forEach(source => {
                    source.stop();
                    activeSourcesRef.current.delete(source);
                });
                nextStartTimeRef.current = 0;
                setAiSpeaking(false);
                return;
            }

            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current && outputNodeRef.current) {
                setAiSpeaking(true);
                const ctx = outputAudioContextRef.current;
                
                // Ensure timing
                nextStartTimeRef.current = Math.max(
                    nextStartTimeRef.current,
                    ctx.currentTime
                );

                const audioBuffer = await decodeAudioData(
                    base64ToBytes(base64Audio),
                    ctx
                );

                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputNodeRef.current);
                
                source.addEventListener('ended', () => {
                    activeSourcesRef.current.delete(source);
                    if (activeSourcesRef.current.size === 0) {
                        setAiSpeaking(false);
                    }
                });

                source.start(nextStartTimeRef.current);
                activeSourcesRef.current.add(source);
                nextStartTimeRef.current += audioBuffer.duration;
            }
          },
          onclose: () => {
            addLog("Sesión cerrada.");
            setIsConnected(false);
            cleanupAudio();
          },
          onerror: (err) => {
            console.error(err);
            setError("Error en la conexión. Revisa la consola.");
            cleanupAudio();
            setIsConnected(false);
          }
        }
      });

      sessionRef.current = await sessionPromise;

    } catch (err: any) {
      console.error(err);
      setError(err.message || "No se pudo conectar.");
      cleanupAudio();
      setIsConnected(false);
    }
  };

  const handleDisconnect = () => {
    if (sessionRef.current) {
        // There isn't an explicit close method on the session object returned by promise in the simplified types,
        // but often the client handles it or we just stop sending data. 
        // We will force cleanup locally.
        addLog("Desconectando...");
        cleanupAudio();
        setIsConnected(false);
        sessionRef.current = null;
        // In a real scenario, we might trigger a close message if the SDK supports it explicitly exposed
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 p-4 sticky top-0 z-10 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-devtech-600 p-2 rounded-lg">
               <Terminal size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">DevTech</h1>
              <p className="text-xs text-slate-400 font-medium">AI CONSULTING SERVICES</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             {isConnected ? (
                 <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/50 text-emerald-400 border border-emerald-800 text-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    En vivo
                 </span>
             ) : (
                 <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-sm">
                    <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                    Desconectado
                 </span>
             )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Services Context */}
        <div className="lg:col-span-2 space-y-6">
            <div className="space-y-2">
                <h2 className="text-3xl font-light text-slate-200">
                    Transformamos el <span className="text-devtech-500 font-bold">caos administrativo</span> en eficiencia pura.
                </h2>
                <p className="text-slate-400 leading-relaxed">
                    Hable con nuestro consultor de IA para descubrir cómo podemos ayudar a su empresa a escalar sin aumentar la carga de trabajo.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Service Card 1 */}
                <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl hover:bg-slate-800 transition-colors">
                    <div className="w-10 h-10 bg-blue-900/50 rounded-lg flex items-center justify-center mb-3">
                        <Server className="text-blue-400" size={20} />
                    </div>
                    <h3 className="font-semibold text-slate-200 mb-1">Auditoría de Flujos</h3>
                    <p className="text-xs text-slate-400">Detección de cuellos de botella y errores en Excel/Email.</p>
                </div>

                {/* Service Card 2 */}
                <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl hover:bg-slate-800 transition-colors">
                    <div className="w-10 h-10 bg-purple-900/50 rounded-lg flex items-center justify-center mb-3">
                        <Users className="text-purple-400" size={20} />
                    </div>
                    <h3 className="font-semibold text-slate-200 mb-1">Capacitación</h3>
                    <p className="text-xs text-slate-400">Upskilling para que su equipo domine la IA administrativa.</p>
                </div>

                {/* Service Card 3 */}
                <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl hover:bg-slate-800 transition-colors">
                    <div className="w-10 h-10 bg-emerald-900/50 rounded-lg flex items-center justify-center mb-3">
                        <Bot className="text-emerald-400" size={20} />
                    </div>
                    <h3 className="font-semibold text-slate-200 mb-1">Automatización</h3>
                    <p className="text-xs text-slate-400">Integraciones n8n para procesos 100% autónomos.</p>
                </div>
            </div>

            {/* Conversation Tips */}
            <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50 mt-8">
                <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-devtech-500"/>
                    Puntos Clave para la Conversación
                </h4>
                <ul className="text-sm text-slate-400 space-y-2 list-disc list-inside">
                    <li>Mencione si sus empleados no son técnicos.</li>
                    <li>Pregunte por el retorno de inversión (ROI).</li>
                    <li>Consulte sobre los precios de la auditoría inicial.</li>
                </ul>
            </div>
        </div>

        {/* Right Column: Interaction Control */}
        <div className="lg:col-span-1">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl sticky top-24 flex flex-col h-[400px]">
                <div className="flex-1 flex flex-col items-center justify-center space-y-8 relative">
                    
                    {/* Visualizer */}
                    <Visualizer isActive={isConnected} isSpeaking={aiSpeaking} />
                    
                    {/* Status Text */}
                    <div className="text-center space-y-1 z-10">
                        <h3 className="text-xl font-medium text-white">
                            {isConnected ? (aiSpeaking ? "DevTech hablando..." : "Escuchando...") : "Listo para iniciar"}
                        </h3>
                        <p className="text-sm text-slate-400">
                            {isConnected ? "Hable libremente para comenzar" : "Conéctese para hablar con la IA"}
                        </p>
                    </div>

                    {/* Main Button */}
                    <button
                        onClick={isConnected ? handleDisconnect : connectToLive}
                        className={`
                            relative group flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 shadow-lg
                            ${isConnected 
                                ? 'bg-red-500 hover:bg-red-600 shadow-red-900/20' 
                                : 'bg-devtech-600 hover:bg-devtech-500 shadow-devtech-900/20'}
                        `}
                    >
                        {isConnected ? (
                            <StopCircle size={32} className="text-white" />
                        ) : (
                            <>
                                <Mic size={32} className="text-white z-10" />
                                <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:animate-ping"></div>
                            </>
                        )}
                    </button>
                    
                    {error && (
                        <div className="absolute bottom-0 w-full text-center p-2 bg-red-900/50 text-red-200 text-xs rounded border border-red-800">
                            {error}
                        </div>
                    )}
                </div>

                {/* Logs / Transcript Snippet */}
                <div className="mt-6 border-t border-slate-700 pt-4 h-24 overflow-hidden">
                    <div className="text-xs text-slate-500 font-mono space-y-1">
                        {logs.map((log, i) => (
                            <div key={i} className="truncate">> {log}</div>
                        ))}
                        {logs.length === 0 && <div className="opacity-50">> Esperando conexión...</div>}
                    </div>
                </div>
            </div>
        </div>

      </main>
    </div>
  );
};

export default App;