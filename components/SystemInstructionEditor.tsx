import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, ArrowLeft, CheckCircle } from 'lucide-react';
import { SYSTEM_INSTRUCTION } from '../constants';

const STORAGE_KEY = 'devtech_system_instruction';

const SystemInstructionEditor: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [instruction, setInstruction] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setInstruction(stored || SYSTEM_INSTRUCTION);
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, instruction);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setInstruction(SYSTEM_INSTRUCTION);
    localStorage.removeItem(STORAGE_KEY);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 p-4 sticky top-0 z-10 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="text-sm">Volver</span>
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">System Instruction Editor</h1>
              <p className="text-xs text-slate-400 font-medium">Personaliza el comportamiento del asistente</p>
            </div>
          </div>
          {saved && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/50 text-emerald-400 border border-emerald-800 text-sm">
              <CheckCircle size={16} />
              Guardado
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-6">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              System Instruction
            </label>
            <p className="text-xs text-slate-400 mb-4">
              Define cómo debe comportarse el asistente de IA. Los cambios se guardan localmente en tu navegador.
            </p>
          </div>

          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            className="w-full h-96 bg-slate-900 border border-slate-600 rounded-lg p-4 text-sm text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-devtech-500 focus:border-transparent resize-none"
            placeholder="Escribe las instrucciones del sistema aquí..."
          />

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-devtech-600 hover:bg-devtech-500 text-white rounded-lg transition-colors font-medium"
            >
              <Save size={18} />
              Guardar cambios
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors font-medium"
            >
              <RotateCcw size={18} />
              Restaurar original
            </button>
          </div>

          <div className="mt-6 p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">💡 Consejos:</h3>
            <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
              <li>Sé específico sobre el rol y tono del asistente</li>
              <li>Define claramente los servicios y productos que ofrece</li>
              <li>Incluye ejemplos de respuestas para situaciones comunes</li>
              <li>Los cambios se aplican en la próxima conexión</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SystemInstructionEditor;
