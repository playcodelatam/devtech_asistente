import { SYSTEM_INSTRUCTION } from '../constants';

const STORAGE_KEY = 'devtech_system_instruction';

export const getSystemInstruction = (): string => {
  if (typeof window === 'undefined') return SYSTEM_INSTRUCTION;
  
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored || SYSTEM_INSTRUCTION;
};

export const setSystemInstruction = (instruction: string): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(STORAGE_KEY, instruction);
};

export const resetSystemInstruction = (): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(STORAGE_KEY);
};
