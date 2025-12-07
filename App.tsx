import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, Server, Users, Bot, StopCircle, CheckCircle2, Terminal, Maximize2, Minimize2 } from 'lucide-react';
import { MODEL_NAME, VOICE_NAME } from './constants';
import { createPcmBlob, base64ToBytes, decodeAudioData } from './utils/audioUtils';
import { getSystemInstruction } from './utils/systemInstruction';
import OrbVisualizer from './components/OrbVisualizer';

// Helper to safely get the API key in both Vite (Browser) and Node (Playground) environments
const getApiKey = (): string => {
  try {
    // Check for Vite environment variable
    if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_KEY) {
      return (import.meta as any).env.VITE_API_KEY;
    }
  } catch (e) {
    // Ignore error if import.meta is not supported
  }
  
  try {
    // Check for Node/Process environment variable
    if (typeof process !== 'undefined' && process.env?.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {
    // Ignore error if process is not defined
  }
  
  return '';
};

const App: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
  const goodbyeDetectedRef = useRef<boolean>(false);
  const disconnectTimeoutRef = useRef<number | null>(null);

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
    goodbyeDetectedRef.current = false;
    if (disconnectTimeoutRef.current) {
      clearTimeout(disconnectTimeoutRef.current);
      disconnectTimeoutRef.current = null;
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    if (sessionRef.current) {
        addLog("Desconectando...");
        cleanupAudio();
        setIsConnected(false);
        sessionRef.current = null;
    }
  }, [cleanupAudio]);

  const connectToLive = async () => {
    setError(null);
    addLog("Inicializando conexión...");

    const apiKey = getApiKey();
    if (!apiKey) {
        setError("API Key no encontrada. Verifica VITE_API_KEY en Cloudflare.");
        return;
    }

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
      const ai = new GoogleGenAI({ apiKey });

      // 4. Connect to Live Session
      const systemInstruction = getSystemInstruction();
      const sessionPromise = ai.live.connect({
        model: MODEL_NAME,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE_NAME } },
          },
          systemInstruction,
        },
        callbacks: {
          onopen: () => {
            addLog("Sesión de DevTech conectada.");
            setIsConnected(true);
            
            // Stream audio from the microphone to the model.
            if (!inputAudioContextRef.current || !mediaStreamRef.current) return;

            inputSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
            processorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);

            processorRef.current.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              
              // CRITICAL: Solely rely on sessionPromise resolves and then call `session.sendRealtimeInput`
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

            // Check for "hasta luego" in text response
            const textParts = message.serverContent?.modelTurn?.parts?.filter(p => p.text);
            if (textParts && textParts.length > 0 && !goodbyeDetectedRef.current) {
                const fullText = textParts.map(p => p.text).join(' ').toLowerCase();
                if (fullText.includes('hasta luego') || fullText.includes('adiós') || fullText.includes('adios') || fullText.includes('chao')) {
                    goodbyeDetectedRef.current = true;
                    addLog("Despedida detectada. Cerrando sesión...");
                    
                    // Clear any existing timeout
                    if (disconnectTimeoutRef.current) {
                        clearTimeout(disconnectTimeoutRef.current);
                    }
                    
                    // Disconnect after audio finishes
                    disconnectTimeoutRef.current = window.setTimeout(() => {
                        if (sessionRef.current) {
                            addLog("Desconectando automáticamente...");
                            handleDisconnect();
                        }
                    }, 4000); // Wait 4 seconds for audio to finish
                }
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
                {/* Fullscreen button */}
                <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="absolute top-4 right-4 z-20 p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                    title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
                >
                    {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>

                <div className="flex-1 flex flex-col items-center justify-center space-y-8 relative">
                    
                    {/* Visualizer */}
                    <OrbVisualizer isActive={isConnected} isSpeaking={aiSpeaking} size="normal" />
                    
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
                            <div key={i} className="truncate">&gt; {log}</div>
                        ))}
                        {logs.length === 0 && <div className="opacity-50">&gt; Esperando conexión...</div>}
                    </div>
                </div>
            </div>
        </div>

      </main>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center">
          {/* Close button */}
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-8 right-8 p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shadow-lg"
            title="Salir de pantalla completa"
          >
            <Minimize2 size={24} />
          </button>

          {/* Large Orb */}
          <div className="flex flex-col items-center justify-center space-y-12">
            <OrbVisualizer isActive={isConnected} isSpeaking={aiSpeaking} size="large" />
            
            {/* Status Text */}
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-medium text-white">
                {isConnected ? (aiSpeaking ? "DevTech hablando..." : "Escuchando...") : "Listo para iniciar"}
              </h2>
              <p className="text-lg text-slate-400">
                {isConnected ? "Hable libremente para comenzar" : "Conéctese para hablar con la IA"}
              </p>
            </div>

            {/* Main Button */}
            <button
              onClick={isConnected ? handleDisconnect : connectToLive}
              className={`
                relative group flex items-center justify-center w-24 h-24 rounded-full transition-all duration-300 shadow-2xl
                ${isConnected 
                  ? 'bg-red-500 hover:bg-red-600 shadow-red-900/40' 
                  : 'bg-devtech-600 hover:bg-devtech-500 shadow-devtech-900/40'}
              `}
            >
              {isConnected ? (
                <StopCircle size={40} className="text-white" />
              ) : (
                <>
                  <Mic size={40} className="text-white z-10" />
                  <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:animate-ping"></div>
                </>
              )}
            </button>

            {/* Error display */}
            {error && (
              <div className="mt-8 max-w-md text-center p-4 bg-red-900/50 text-red-200 text-sm rounded-lg border border-red-800">
                {error}
              </div>
            )}

            {/* Logs */}
            <div className="mt-8 w-full max-w-2xl">
              <div className="text-sm text-slate-500 font-mono space-y-2 text-center">
                {logs.slice(-3).map((log, i) => (
                  <div key={i} className="opacity-75">&gt; {log}</div>
                ))}
                {logs.length === 0 && <div className="opacity-50">&gt; Esperando conexión...</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;