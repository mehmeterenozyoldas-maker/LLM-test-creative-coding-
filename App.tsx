import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Orchestra } from './components/Orchestra';
import { audioEngine } from './utils/audio';
import { ViewMode, InteractionMode } from './constants';

const Overlay: React.FC<{ started: boolean; onStart: () => void }> = ({ started, onStart }) => {
  if (started) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 transition-opacity duration-500">
      <div className="text-center p-8 border border-white/20 rounded-lg bg-[#0A1A3F] shadow-2xl max-w-md">
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tighter">Gravity Orchestra</h1>
        <p className="text-blue-200 mb-8 font-light">
            A generative audiovisual experience.
        </p>
        <button
          onClick={onStart}
          className="px-8 py-3 bg-white text-[#0A1A3F] font-bold rounded-full hover:bg-cyan-300 hover:scale-105 transition-all duration-200 shadow-[0_0_20px_rgba(0,255,255,0.3)]"
        >
          Enter the Box
        </button>
      </div>
    </div>
  );
};

const Dashboard: React.FC<{ 
    onGravityChange: (x: number, z: number) => void;
    onViewChange: (mode: ViewMode) => void;
    currentView: ViewMode;
    onProjectionToggle: () => void;
    projectionMode: boolean;
    onInteractionModeChange: (mode: InteractionMode) => void;
    interactionMode: InteractionMode;
    onClearWalls: () => void;
}> = ({ 
    onGravityChange, onViewChange, currentView, 
    onProjectionToggle, projectionMode,
    onInteractionModeChange, interactionMode, onClearWalls
}) => {
    const [tiltX, setTiltX] = useState(0);
    const [tiltZ, setTiltZ] = useState(0);

    const handleTilt = (axis: 'x' | 'z', value: string) => {
        const val = parseFloat(value);
        if (axis === 'x') setTiltX(val);
        else setTiltZ(val);
        onGravityChange(axis === 'x' ? val : tiltX, axis === 'z' ? val : tiltZ);
    };

    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-5xl bg-[#0A1A3F]/90 backdrop-blur-md border border-blue-500/30 rounded-2xl p-4 flex flex-col lg:flex-row gap-6 items-center shadow-2xl z-40">
            
            {/* 1. Mode Switcher (Spawn vs Build) */}
            <div className="flex flex-col gap-2 w-full lg:w-1/4">
                <label className="text-[10px] text-blue-300 uppercase font-bold tracking-widest">Interaction</label>
                <div className="flex bg-blue-950 rounded p-1 gap-1">
                    <button 
                        onClick={() => onInteractionModeChange(InteractionMode.SPAWN)}
                        className={`flex-1 py-1 text-xs rounded transition-colors ${interactionMode === InteractionMode.SPAWN ? 'bg-cyan-600 text-white shadow-lg' : 'text-blue-400 hover:bg-blue-900'}`}
                    >
                        SPAWN
                    </button>
                    <button 
                        onClick={() => onInteractionModeChange(InteractionMode.BUILD)}
                        className={`flex-1 py-1 text-xs rounded transition-colors ${interactionMode === InteractionMode.BUILD ? 'bg-green-600 text-white shadow-lg' : 'text-blue-400 hover:bg-blue-900'}`}
                    >
                        BUILD
                    </button>
                </div>
                {interactionMode === InteractionMode.BUILD && (
                    <button onClick={onClearWalls} className="text-[10px] text-red-400 hover:text-red-200 text-right underline decoration-dotted">
                        Clear Walls
                    </button>
                )}
            </div>

            {/* 2. Gravity Controls */}
            <div className="flex flex-col gap-2 w-full lg:w-1/4 border-l border-blue-800/50 pl-0 lg:pl-6">
                <label className="text-[10px] text-blue-300 uppercase font-bold tracking-widest">Gravity Tilt</label>
                <div className="flex items-center gap-2">
                    <span className="text-blue-200 text-xs w-3">X</span>
                    <input 
                        type="range" min="-5" max="5" step="0.1" value={tiltX} 
                        onChange={(e) => handleTilt('x', e.target.value)}
                        className="w-full h-1 bg-blue-900 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-blue-200 text-xs w-3">Z</span>
                    <input 
                        type="range" min="-5" max="5" step="0.1" value={tiltZ} 
                        onChange={(e) => handleTilt('z', e.target.value)}
                        className="w-full h-1 bg-blue-900 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400"
                    />
                </div>
            </div>

            {/* 3. View Switcher */}
            <div className="flex flex-col gap-2 w-full lg:w-1/4 items-center border-l border-blue-800/50 pl-0 lg:pl-6">
                <label className="text-[10px] text-blue-300 uppercase font-bold tracking-widest">Screens</label>
                <div className="flex gap-2">
                    {Object.values(ViewMode).map(mode => (
                        <button
                            key={mode}
                            onClick={() => onViewChange(mode)}
                            className={`px-3 py-1 text-xs rounded border transition-all ${currentView === mode ? 'bg-cyan-500 text-black border-cyan-500 font-bold' : 'bg-transparent text-blue-300 border-blue-800 hover:border-cyan-500'}`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
            </div>

             {/* 4. Projection Toggle */}
             <div className="flex flex-col gap-2 w-full lg:w-1/4 items-end border-l border-blue-800/50 pl-0 lg:pl-6">
                <label className="text-[10px] text-blue-300 uppercase font-bold tracking-widest">Projection</label>
                <button
                    onClick={onProjectionToggle}
                    className={`w-full px-4 py-2 text-xs rounded border transition-all ${projectionMode ? 'bg-magenta-500 text-white border-white shadow-[0_0_15px_rgba(255,0,255,0.5)]' : 'bg-transparent text-blue-300 border-blue-800'}`}
                    style={{ backgroundColor: projectionMode ? '#d946ef' : '' }}
                >
                    {projectionMode ? 'PROJECTOR ON' : 'PROJECTOR OFF'}
                </button>
            </div>
        </div>
    );
};

const App: React.FC = () => {
  const [started, setStarted] = useState(false);
  const [gravity, setGravity] = useState<[number, number, number]>([0, -9.81, 0]);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.DIRECTOR);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>(InteractionMode.SPAWN);
  const [projectionMode, setProjectionMode] = useState(false);
  const [clearTrigger, setClearTrigger] = useState(0);

  const handleStart = async () => {
    await audioEngine.init();
    setStarted(true);
  };

  const handleGravityChange = (x: number, z: number) => {
      setGravity([x, -9.81, z]);
  };

  return (
    <div className="relative w-full h-full bg-[#050b1d]">
      <Overlay started={started} onStart={handleStart} />
      
      {started && (
          <Dashboard 
            onGravityChange={handleGravityChange} 
            onViewChange={setViewMode}
            currentView={viewMode}
            onProjectionToggle={() => setProjectionMode(!projectionMode)}
            projectionMode={projectionMode}
            onInteractionModeChange={setInteractionMode}
            interactionMode={interactionMode}
            onClearWalls={() => setClearTrigger(c => c + 1)}
          />
      )}

      {/* Instructions Overlay */}
      {started && !projectionMode && (
          <div className="absolute top-4 left-4 pointer-events-none text-white/40 text-xs font-mono select-none z-0">
              {interactionMode === InteractionMode.SPAWN ? (
                  <>
                    <p>MODE: SPAWN</p>
                    <p>TAP TO DROP OBJECTS</p>
                  </>
              ) : (
                  <>
                     <p className="text-green-400">MODE: BUILD</p>
                     <p>DRAG TO DRAW WALLS</p>
                  </>
              )}
          </div>
      )}
      
      <Canvas
        shadows
        dpr={[1, 2]}
        className="touch-none"
      >
        <color attach="background" args={['#050b1d']} />
        
        <Orchestra 
            gravity={gravity} 
            viewMode={viewMode} 
            projectionMode={projectionMode}
            interactionMode={interactionMode}
            onClearWalls={() => {}} // handled via trigger
            clearTrigger={clearTrigger}
        />
      </Canvas>
    </div>
  );
};

export default App;