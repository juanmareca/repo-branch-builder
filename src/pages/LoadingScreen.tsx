import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';

interface LoadingScreenProps {
  onComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('Iniciando...');

  const steps = [
    { progress: 15, text: 'Iniciando sistema...' },
    { progress: 30, text: 'Cargando configuración...' },
    { progress: 45, text: 'Conectando base de datos...' },
    { progress: 60, text: 'Preparando dashboard...' },
    { progress: 75, text: 'Cargando módulos...' },
    { progress: 90, text: 'Finalizando...' },
    { progress: 100, text: 'Completado' }
  ];

  useEffect(() => {
    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setProgress(steps[stepIndex].progress);
        setCurrentStep(steps[stepIndex].text);
        stepIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          onComplete();
        }, 500);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background tech pattern */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/6 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/6 w-80 h-80 bg-accent/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-conic from-primary/5 via-transparent to-accent/5 rounded-full blur-2xl animate-spin" style={{ animationDuration: '20s' }}></div>
        
        {/* Tech grid pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-12 gap-4 h-full">
            {Array.from({ length: 144 }).map((_, i) => (
              <div 
                key={i} 
                className="border border-primary/20 animate-pulse" 
                style={{ animationDelay: `${i * 50}ms`, animationDuration: '3s' }}
              ></div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center max-w-md w-full">
        {/* Logo and title */}
        <div className="mb-12">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent mb-4 animate-fade-in">
            Stratesys
          </h1>
          <p className="text-muted-foreground text-lg animate-fade-in delay-300">
            Sistema Avanzado de Gestión de Asignaciones
          </p>
        </div>

        {/* Progress section */}
        <div className="space-y-6 animate-fade-in delay-500">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Preparando dashboard...
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              {currentStep}
            </p>
          </div>

          {/* Progress bar */}
          <div className="space-y-3">
            <div className="relative">
              <Progress 
                value={progress} 
                className="h-3 bg-muted/30 overflow-hidden"
              />
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-pulse"></div>
            </div>
            
            {/* Progress percentage and status */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">
                Iniciando...
              </span>
              <span className="font-mono font-bold text-primary">
                {progress}%
              </span>
              <span className="text-muted-foreground">
                {progress === 100 ? 'Completado' : 'En progreso'}
              </span>
            </div>
          </div>

          {/* Loading animation dots */}
          <div className="flex justify-center items-center space-x-2 mt-8">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200"></div>
          </div>
        </div>

        {/* Tech decorations */}
        <div className="absolute -top-8 -left-8 w-16 h-16 border-2 border-primary/30 rounded-lg rotate-45 animate-spin"></div>
        <div className="absolute -bottom-8 -right-8 w-12 h-12 border-2 border-accent/30 rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 -right-12 w-8 h-8 border border-primary/40 rotate-45 animate-bounce"></div>
        <div className="absolute top-1/4 -left-12 w-6 h-6 border border-accent/40 rounded-full animate-ping"></div>
      </div>

      {/* Version info */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-xs text-muted-foreground">
          Versión 2.0 • Tecnología de Vanguardia
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;