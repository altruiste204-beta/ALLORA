import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { AlloraAnimatedLogo } from './AlloraAnimatedLogo';

interface AppLoadingScreenProps {
  isExiting?: boolean;
  onFinish?: () => void;
  statusMessage?: string;
}

export const AppLoadingScreen: React.FC<AppLoadingScreenProps> = ({
  isExiting = false,
  onFinish,
  statusMessage,
}) => {
  const { t } = useLanguage();
  const [progress, setProgress] = useState(15);
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    t.common?.initializing || 'Initialisation sécurisée des services & communautés',
    t.brand?.tagline || 'Connectés pour servir',
    t.brand?.corePhilosophy1 || 'Ce que tu as peut répondre au besoin de ton frère',
  ];

  useEffect(() => {
    // Smooth progress simulation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95;
        const jump = Math.floor(Math.random() * 14) + 6;
        return Math.min(prev + jump, 95);
      });
    }, 240);

    const stepInterval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % steps.length);
    }, 1800);

    return () => {
      clearInterval(interval);
      clearInterval(stepInterval);
    };
  }, [steps.length]);

  useEffect(() => {
    if (isExiting) {
      setProgress(100);
      const timer = setTimeout(() => {
        if (onFinish) onFinish();
      }, 650);
      return () => clearTimeout(timer);
    }
  }, [isExiting, onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#19344A] text-white selection:bg-[#67B7E8]/30 px-6 transition-all duration-700 ease-in-out ${
        isExiting
          ? 'opacity-0 scale-105 pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
      aria-label="Écran de chargement ALLORA"
      role="status"
    >
      {/* Background radial cyan glow */}
      <div 
        className="absolute w-[450px] h-[450px] rounded-full pointer-events-none animate-allora-aura"
        style={{
          background: 'radial-gradient(circle, rgba(103, 183, 232, 0.32) 0%, rgba(220, 239, 250, 0.12) 45%, rgba(25, 52, 74, 0) 70%)',
        }}
      />

      <div className="relative flex flex-col items-center justify-center max-w-sm w-full text-center space-y-6 z-10 animate-in fade-in zoom-in-95 duration-500">
        {/* Animated Tri-Color Logo Badge */}
        <AlloraAnimatedLogo size="lg" showText={true} showTagline={true} />

        {/* Animated Progress Bar */}
        <div className="w-full max-w-xs space-y-3 pt-2">
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10 backdrop-blur-sm">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#67B7E8] via-[#DCEFFA] to-[#67B7E8] transition-all duration-300 ease-out shadow-sm shadow-sky-400/50"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Cycling Status message */}
          <p className="text-[11px] sm:text-xs text-[#DCEFFA]/90 font-medium min-h-[1.5rem] flex items-center justify-center transition-all duration-300">
            {statusMessage || steps[stepIndex]}
          </p>
        </div>
      </div>
    </div>
  );
};
