import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Circle, Cylinder, Settings, Volume2, Trash2, Edit3, PlusSquare } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Orchestra } from './components/Orchestra';
import { ControllerGrid } from './components/ControllerGrid';
import { audioEngine } from './utils/audio';
import { ViewMode, InteractionMode, ShapeType, SCALES, WallData, PhysicalObject } from './constants';
import { cn } from './utils/cn';
import { usePeerManager, PeerMessage } from './hooks/usePeer';

const Overlay: React.FC<{ started: boolean; onStart: () => void }> = ({ started, onStart }) => {
  return (
    <AnimatePresence>
        {!started && (
            <motion.div 
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                className="absolute inset-0 z-50 flex items-center justify-center bg-[#050b1d]/80 backdrop-blur-md"
            >
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="text-center p-12 border border-cyan-500/20 rounded-2xl bg-[#0A1A3F]/50 shadow-2xl max-w-lg backdrop-blur-xl"
            >
                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-magenta-400 mb-4 tracking-tighter">
                    Gravity Orchestra
                </h1>
                <p className="text-cyan-100/70 mb-8 font-light text-lg">
                    A generative audiovisual experience.
                </p>
                <button
                onClick={onStart}
                className="group relative px-8 py-3 bg-white text-[#0A1A3F] font-bold rounded-full overflow-hidden transition-all hover:scale-105 shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:shadow-[0_0_40px_rgba(0,255,255,0.6)]"
                >
                    <span className="relative z-10 flex items-center gap-2">
                        <Volume2 className="w-4 h-4 group-hover:animate-pulse" />
                        Enter the Box
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-300 to-magenta-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
            </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
  );
};

const QRCodeDisplay = ({ session, status, error }: { session: string, status?: string, error?: string | null }) => {
  const url = `${window.location.origin}${window.location.pathname}?session=${session}`;
  return (
    <div className="absolute top-6 right-6 z-50 p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-2xl flex flex-col items-center">
        <p className="text-white text-[10px] font-bold mb-2 tracking-widest uppercase">Scan to Control</p>
        <div className="bg-white p-2 rounded">
            <QRCodeSVG value={url} size={80} />
        </div>
        {status && <p className="text-cyan-400 text-[10px] mt-2 whitespace-nowrap overflow-hidden max-w-[120px] text-ellipsis">{status}</p>}
        {error && <p className="text-red-400 text-[10px] mt-1 whitespace-nowrap max-w-[120px] text-ellipsis" title={error}>{error}</p>}
    </div>
  )
}

const Dashboard: React.FC<{ 
    onGravityChange: (x: number, z: number) => void;
    onViewChange: (mode: ViewMode) => void;
    currentView: ViewMode;
    onInteractionModeChange: (mode: InteractionMode) => void;
    interactionMode: InteractionMode;
    shapeMode: ShapeType;
    onShapeChange: (mode: ShapeType) => void;
    onClearWalls: () => void;
    onClearObjects: () => void;
    currentScale: string;
    onScaleChange: (scale: string) => void;
    className?: string;
}> = ({ 
    onGravityChange, onViewChange, currentView, 
    onInteractionModeChange, interactionMode, onClearWalls, onClearObjects,
    shapeMode, onShapeChange, currentScale, onScaleChange,
    className
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
        <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1 }}
            className={cn("absolute bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl bg-[#010b1d]/60 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-3 flex flex-row flex-wrap sm:flex-nowrap gap-4 items-center shadow-2xl z-40 overflow-x-auto no-scrollbar max-h-[40vh] sm:max-h-none", className)}
        >
            
            {/* 1. Interaction Modes */}
            <div className="flex flex-col gap-2 shrink-0 flex-1 min-w-[150px]">
                <label className="text-[10px] text-cyan-500/80 uppercase font-bold tracking-widest flex items-center gap-1">
                   <Settings className="w-3 h-3" /> ACTION
                </label>
                <div className="flex bg-black/40 rounded-lg p-1 gap-1 border border-white/5 shadow-inner">
                    <button 
                        onClick={() => onInteractionModeChange(InteractionMode.SPAWN)}
                        className={cn(
                            "flex-1 py-2 text-xs rounded-md transition-all flex items-center justify-center gap-2",
                            interactionMode === InteractionMode.SPAWN ? 'bg-cyan-500 text-black shadow-lg font-bold' : 'text-cyan-500 hover:bg-white/5'
                        )}
                    >
                        <PlusSquare className="w-4 h-4" /> SPAWN
                    </button>
                    <button 
                        onClick={() => onInteractionModeChange(InteractionMode.BUILD)}
                        className={cn(
                            "flex-1 py-2 text-xs rounded-md transition-all flex items-center justify-center gap-2",
                            interactionMode === InteractionMode.BUILD ? 'bg-magenta-500 text-white shadow-lg font-bold' : 'text-magenta-500 hover:bg-white/5'
                        )}
                    >
                        <Edit3 className="w-4 h-4" /> BUILD
                    </button>
                </div>
            </div>

            {/* 2. Shape Selector (if SPAWN) / Wall Actions (if BUILD) */}
            <div className="flex flex-col gap-2 shrink-0 border-l border-white/10 pl-4">
                 {interactionMode === InteractionMode.SPAWN ? (
                    <>
                        <label className="text-[10px] text-cyan-500/80 uppercase font-bold tracking-widest">Shape</label>
                        <div className="flex items-center gap-2">
                             <button onClick={() => onShapeChange(ShapeType.SPHERE)} className={cn("p-2 rounded border transition-colors", shapeMode === ShapeType.SPHERE ? "bg-cyan-400 text-black border-cyan-400" : "text-white/50 border-white/10 hover:border-cyan-400")}>
                                 <Circle className="w-4 h-4" />
                             </button>
                             <button onClick={() => onShapeChange(ShapeType.BOX)} className={cn("p-2 rounded border transition-colors", shapeMode === ShapeType.BOX ? "bg-magenta-400 text-white border-magenta-400" : "text-white/50 border-white/10 hover:border-magenta-400")}>
                                 <Box className="w-4 h-4" />
                             </button>
                             <button onClick={() => onShapeChange(ShapeType.CYLINDER)} className={cn("p-2 rounded border transition-colors", shapeMode === ShapeType.CYLINDER ? "bg-[#22D3EE] text-black border-[#22D3EE]" : "text-white/50 border-white/10 hover:border-[#22D3EE]")}>
                                 <Cylinder className="w-4 h-4" />
                             </button>
                        </div>
                    </>
                 ) : (
                    <>
                         <label className="text-[10px] text-magenta-500/80 uppercase font-bold tracking-widest">Clear</label>
                         <button onClick={onClearWalls} className="flex items-center gap-2 px-3 py-2 text-xs rounded bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/40 transition-colors">
                              <Trash2 className="w-4 h-4" /> Walls
                         </button>
                    </>
                 )}
            </div>

            {/* Scale Selector */}
            <div className="flex flex-col gap-2 shrink-0 border-l border-white/10 pl-4 min-w-[120px]">
                <label className="text-[10px] text-cyan-500/80 uppercase font-bold tracking-widest">Audio Scale</label>
                <div className="flex flex-wrap gap-2">
                    {Object.keys(SCALES).map(scaleKey => (
                        <button
                            key={scaleKey}
                            onClick={() => onScaleChange(scaleKey)}
                            className={cn(
                                "text-[10px] px-2 py-1 rounded border transition-all",
                                currentScale === scaleKey ? "bg-white text-black font-bold" : "border-white/20 text-white/70 hover:border-white"
                            )}
                        >
                            {scaleKey}
                        </button>
                    ))}
                </div>
            </div>

            {/* Gravity */}
            <div className="flex flex-col gap-2 flex-1 shrink-0 min-w-[150px] border-l border-white/10 pl-4">
                <div className="flex justify-between items-end">
                    <label className="text-[10px] text-cyan-500/80 uppercase font-bold tracking-widest">Gravity Tilt</label>
                    <button onClick={onClearObjects} className="text-[10px] flex items-center gap-1 text-red-400 hover:text-red-300">
                        <Trash2 className="w-3 h-3" /> Clr Objs
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-white/50 text-xs w-3 font-mono">X</span>
                    <input 
                        type="range" min="-5" max="5" step="0.1" value={tiltX} 
                        onChange={(e) => handleTilt('x', e.target.value)}
                        className="w-full h-1 bg-black rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-white/50 text-xs w-3 font-mono">Z</span>
                    <input 
                        type="range" min="-5" max="5" step="0.1" value={tiltZ} 
                        onChange={(e) => handleTilt('z', e.target.value)}
                        className="w-full h-1 bg-black rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400"
                    />
                </div>
            </div>

            {/* View Switcher */}
            <div className="flex flex-col gap-2 shrink-0 items-center justify-center border-l border-white/10 pl-4">
                <label className="text-[10px] text-cyan-500/80 uppercase font-bold tracking-widest">Camera</label>
                <div className="flex gap-1 bg-black/40 p-1 rounded-lg">
                    {Object.values(ViewMode).map(mode => (
                        <button
                            key={mode}
                            onClick={() => onViewChange(mode)}
                            className={cn(
                                "px-2 py-1 text-[10px] font-mono rounded transition-all",
                                currentView === mode ? "bg-cyan-500 text-black shadow-lg" : "text-white/50 hover:text-white hover:bg-white/10"
                            )}
                        >
                            {mode.substring(0, 3)}
                        </button>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

const HostApp: React.FC = () => {
    const [started, setStarted] = useState(false);
    const [gravity, setGravity] = useState<[number, number, number]>([0, -9.81, 0]);
    const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.DIRECTOR);
    const [interactionMode, setInteractionMode] = useState<InteractionMode>(InteractionMode.SPAWN);
    const [shapeMode, setShapeMode] = useState<ShapeType>(ShapeType.SPHERE);
    const [currentScale, setCurrentScale] = useState<string>('PENTATONIC');
    
    const [clearWallTrigger, setClearWallTrigger] = useState(0);
    const [clearObjectsTrigger, setClearObjectsTrigger] = useState(0);

    const [spawnObjectTrigger, setSpawnObjectTrigger] = useState<PhysicalObject | null>(null);
    const [remoteDrawState, setRemoteDrawState] = useState<{ state: 'start' | 'move' | 'end', point: [number, number, number] } | null>(null);
    const [deleteWallTrigger, setDeleteWallTrigger] = useState<string | null>(null);

    const wallsRef = useRef<WallData[]>([]);
    const objectsRef = useRef<PhysicalObject[]>([]);

    const { peerId, connections, lastMessage, sendMessage, status, error } = usePeerManager('host');

    const handleStart = async () => {
        await audioEngine.init();
        setStarted(true);
    };

    const handleGravityChange = (x: number, z: number) => {
        setGravity([x, -9.81, z]);
        sendMessage({ type: 'CONTROL_ACTION', payload: { action: 'gravity', x, z } });
    };

    const handleScaleChange = (scale: string) => {
        setCurrentScale(scale);
        audioEngine.setScale(scale as keyof typeof SCALES);
        sendMessage({ type: 'CONTROL_ACTION', payload: { action: 'scale', scale } });
    };

    const handleWallsUpdate = (walls: WallData[]) => {
        wallsRef.current = walls;
        sendMessage({ type: 'STATE_SYNC', payload: { walls } });
    };

    const handleObjectsUpdate = (objects: PhysicalObject[]) => {
        objectsRef.current = objects;
        sendMessage({ type: 'STATE_SYNC', payload: { objects } });
    };

    // Send full state to newly connected clients
    useEffect(() => {
        if (connections.length > 0) {
            sendMessage({ type: 'STATE_SYNC', payload: { walls: wallsRef.current, objects: objectsRef.current } });
            sendMessage({ type: 'CONTROL_ACTION', payload: { action: 'gravity', x: gravity[0], z: gravity[2] } });
            sendMessage({ type: 'CONTROL_ACTION', payload: { action: 'scale', scale: currentScale } });
            sendMessage({ type: 'CONTROL_ACTION', payload: { action: 'viewMode', mode: viewMode } });
            sendMessage({ type: 'CONTROL_ACTION', payload: { action: 'interactionMode', mode: interactionMode } });
            sendMessage({ type: 'CONTROL_ACTION', payload: { action: 'shapeMode', mode: shapeMode } });
        }
    }, [connections.length]);

    // Listen to messages from controller
    useEffect(() => {
        if (!lastMessage) return;

        if (lastMessage.type === 'WALLS_CLEARED') {
            setClearWallTrigger(c => c + 1);
        } else if (lastMessage.type === 'OBJECTS_CLEARED') {
            setClearObjectsTrigger(c => c + 1);
        } else if (lastMessage.type === 'OBJECT_SPAWNED') {
            if (lastMessage.payload?.obj) {
                setSpawnObjectTrigger(lastMessage.payload.obj);
            }
        } else if (lastMessage.type === 'DELETE_WALL') {
            setDeleteWallTrigger(lastMessage.payload.id);
        } else if (lastMessage.type === 'DRAW_START') {
            setRemoteDrawState({ state: 'start', point: lastMessage.payload.point });
        } else if (lastMessage.type === 'DRAW_MOVE') {
            setRemoteDrawState({ state: 'move', point: lastMessage.payload.point });
        } else if (lastMessage.type === 'DRAW_END') {
            setRemoteDrawState({ state: 'end', point: lastMessage.payload.point });
        } else if (lastMessage.type === 'CONTROL_ACTION') {
            const { action } = lastMessage.payload;
            if (action === 'gravity') setGravity([lastMessage.payload.x, -9.81, lastMessage.payload.z]);
            if (action === 'scale') {
                setCurrentScale(lastMessage.payload.scale);
                audioEngine.setScale(lastMessage.payload.scale as keyof typeof SCALES);
            }
            if (action === 'viewMode') setViewMode(lastMessage.payload.mode);
            if (action === 'interactionMode') setInteractionMode(lastMessage.payload.mode);
            if (action === 'shapeMode') setShapeMode(lastMessage.payload.mode);
        }
    }, [lastMessage]);

    return (
        <div className="relative w-full h-full bg-[#050b1d] overflow-hidden">
        <Overlay started={started} onStart={handleStart} />
        
        {started && peerId && <QRCodeDisplay session={peerId} status={status} error={error} />}

        {started && connections.length === 0 && (
            <Dashboard 
                onGravityChange={handleGravityChange} 
                onViewChange={(mode) => { setViewMode(mode); sendMessage({ type: 'CONTROL_ACTION', payload: { action: 'viewMode', mode } }); }}
                currentView={viewMode}
                onInteractionModeChange={(mode) => { setInteractionMode(mode); sendMessage({ type: 'CONTROL_ACTION', payload: { action: 'interactionMode', mode } }); }}
                interactionMode={interactionMode}
                onClearWalls={() => { setClearWallTrigger(c => c + 1); sendMessage({ type: 'WALLS_CLEARED' }); }}
                onClearObjects={() => { setClearObjectsTrigger(c => c + 1); sendMessage({ type: 'OBJECTS_CLEARED' }); }}
                shapeMode={shapeMode}
                onShapeChange={(mode) => { setShapeMode(mode); sendMessage({ type: 'CONTROL_ACTION', payload: { action: 'shapeMode', mode } }); }}
                currentScale={currentScale}
                onScaleChange={handleScaleChange}
            />
        )}

        {/* Instructions Overlay */}
        {started && connections.length === 0 && (
            <div className="absolute top-6 left-6 pointer-events-none text-white/50 text-xs font-mono select-none z-0">
                {interactionMode === InteractionMode.SPAWN ? (
                    <>
                        <p className="text-cyan-400 font-bold mb-1">MODE: SPAWN</p>
                        <p>TAP OR DRAG ON GRID TO DROP OBJECTS</p>
                    </>
                ) : (
                    <>
                        <p className="text-magenta-400 font-bold mb-1">MODE: BUILD</p>
                        <p>DRAG TO DRAW INVISIBLE BOUNCE WALLS</p>
                    </>
                )}
            </div>
        )}

        {started && connections.length > 0 && (
            <div className="absolute bottom-6 left-6 text-white/50 text-xs font-mono pointer-events-none z-10 bg-black/40 p-2 rounded">
                iPad Controller Connected
            </div>
        )}
        
        <Canvas
            shadows
            dpr={[1, 2]}
            className="touch-none bg-black"
        >
            <Orchestra 
                gravity={gravity} 
                viewMode={viewMode} 
                projectionMode={false}
                interactionMode={interactionMode}
                selectedShape={shapeMode}
                onClearWalls={() => {}}
                clearTrigger={clearWallTrigger}
                clearObjectsTrigger={clearObjectsTrigger}
                spawnObjectTrigger={spawnObjectTrigger}
                onWallsUpdate={handleWallsUpdate}
                onObjectsUpdate={handleObjectsUpdate}
                remoteDrawState={remoteDrawState}
                deleteWallTrigger={deleteWallTrigger}
            />
        </Canvas>
        </div>
    );
};

const ClientApp: React.FC<{ sessionId: string }> = ({ sessionId }) => {
    const { connections, lastMessage, sendMessage, error, status } = usePeerManager('client', sessionId);
    const [gravity, setGravity] = useState<[number, number, number]>([0, -9.81, 0]);
    const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.DIRECTOR);
    const [interactionMode, setInteractionMode] = useState<InteractionMode>(InteractionMode.SPAWN);
    const [shapeMode, setShapeMode] = useState<ShapeType>(ShapeType.SPHERE);
    const [currentScale, setCurrentScale] = useState<string>('PENTATONIC');
    const [walls, setWalls] = useState<WallData[]>([]);

    useEffect(() => {
        if (!lastMessage) return;
        if (lastMessage.type === 'STATE_SYNC') {
            if (lastMessage.payload?.walls) setWalls(lastMessage.payload.walls);
        } else if (lastMessage.type === 'CONTROL_ACTION') {
            const { action } = lastMessage.payload;
            if (action === 'gravity') setGravity([lastMessage.payload.x, -9.81, lastMessage.payload.z]);
            if (action === 'scale') setCurrentScale(lastMessage.payload.scale);
            if (action === 'viewMode') setViewMode(lastMessage.payload.mode);
            if (action === 'interactionMode') setInteractionMode(lastMessage.payload.mode);
            if (action === 'shapeMode') setShapeMode(lastMessage.payload.mode);
        }
    }, [lastMessage]);

    const isConnected = connections.length > 0;

    const handleRetry = () => {
        // Just reload the page to restart the peer process completely
        window.location.reload();
    };

    return (
        <div className="w-full h-full bg-[#050b1d] overflow-hidden flex flex-col items-center justify-center p-4">
            {!isConnected ? (
                <div className="text-white flex flex-col items-center gap-4 font-mono tracking-widest text-sm text-center">
                    <span className="animate-pulse">CONNECTING TO HOST...</span>
                    <span className="text-cyan-400 text-xs">Status: {status}</span>
                    {error && <span className="text-red-400 text-xs max-w-xs">{error}</span>}
                    <button 
                        onClick={handleRetry}
                        className="mt-4 px-4 py-2 border border-white/20 rounded hover:bg-white/10 text-xs transition-colors"
                    >
                        RETRY CONNECTION
                    </button>
                </div>
            ) : (
                <div className="w-full max-w-md bg-[#010b1d] border border-cyan-500/20 rounded-2xl p-4 shadow-2xl relative h-[90vh] sm:h-full max-h-[800px] flex flex-col">
                    <h2 className="text-cyan-400 font-bold mb-2 tracking-widest text-center text-sm uppercase shrink-0">Gravity Controller</h2>
                    
                    <div className="flex-1 w-full bg-black/40 border border-white/10 rounded-xl mb-4 relative overflow-hidden flex items-center justify-center touch-none min-h-[200px]">
                        <ControllerGrid 
                           walls={walls} 
                           interactionMode={interactionMode}
                           onDrawStart={(point) => sendMessage({ type: 'DRAW_START', payload: { point } })}
                           onDrawMove={(point) => sendMessage({ type: 'DRAW_MOVE', payload: { point } })}
                           onDrawEnd={(point) => sendMessage({ type: 'DRAW_END', payload: { point } })}
                           onDeleteWall={(id) => sendMessage({ type: 'DELETE_WALL', payload: { id } })}
                           onSpawnObject={(point) => {
                               // Generate object structure and send SPAWN event
                               const obj: PhysicalObject = {
                                   id: Math.random().toString(36).substr(2, 9),
                                   type: shapeMode,
                                   position: [point[0], 8 + Math.random(), point[2]],
                                   rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
                               };
                               sendMessage({ type: 'OBJECT_SPAWNED', payload: { obj } });
                           }}
                        />
                    </div>

                    <div className="flex flex-col gap-2 overflow-y-auto overflow-x-hidden p-1 min-h-[150px]">
                        <div className="flex gap-2 shrink-0">
                            <button 
                                onClick={() => { setInteractionMode(InteractionMode.SPAWN); sendMessage({ type: 'CONTROL_ACTION', payload: { action: 'interactionMode', mode: InteractionMode.SPAWN } }); }}
                                className={cn("flex-1 py-3 text-xs rounded-lg transition-all flex items-center justify-center gap-2", interactionMode === InteractionMode.SPAWN ? 'bg-cyan-500 text-black shadow-lg font-bold' : 'bg-black/40 text-cyan-500 border border-white/5')}
                            >
                                <PlusSquare className="w-4 h-4" /> SPAWN
                            </button>
                            <button 
                                onClick={() => { setInteractionMode(InteractionMode.BUILD); sendMessage({ type: 'CONTROL_ACTION', payload: { action: 'interactionMode', mode: InteractionMode.BUILD } }); }}
                                className={cn("flex-1 py-3 text-xs rounded-lg transition-all flex items-center justify-center gap-2", interactionMode === InteractionMode.BUILD ? 'bg-magenta-500 text-white shadow-lg font-bold' : 'bg-black/40 text-magenta-500 border border-white/5')}
                            >
                                <Edit3 className="w-4 h-4" /> BUILD
                            </button>
                        </div>
                        
                        {interactionMode === InteractionMode.SPAWN ? (
                            <div className="flex items-center justify-between gap-2 mt-0 shrink-0 bg-black/40 p-2 rounded-lg border border-white/5">
                                <label className="text-[10px] text-cyan-500/80 uppercase font-bold tracking-widest pl-2">Shape</label>
                                <div className="flex gap-2">
                                    <button onClick={() => { setShapeMode(ShapeType.SPHERE); sendMessage({ type: 'CONTROL_ACTION', payload: { action: 'shapeMode', mode: ShapeType.SPHERE } }); }} className={cn("p-3 rounded border transition-colors", shapeMode === ShapeType.SPHERE ? "bg-cyan-400 text-black border-cyan-400" : "bg-black text-white/50 border-white/10")}>
                                        <Circle className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => { setShapeMode(ShapeType.BOX); sendMessage({ type: 'CONTROL_ACTION', payload: { action: 'shapeMode', mode: ShapeType.BOX } }); }} className={cn("p-3 rounded border transition-colors", shapeMode === ShapeType.BOX ? "bg-magenta-400 text-white border-magenta-400" : "bg-black text-white/50 border-white/10")}>
                                        <Box className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => { setShapeMode(ShapeType.CYLINDER); sendMessage({ type: 'CONTROL_ACTION', payload: { action: 'shapeMode', mode: ShapeType.CYLINDER } }); }} className={cn("p-3 rounded border transition-colors", shapeMode === ShapeType.CYLINDER ? "bg-[#22D3EE] text-black border-[#22D3EE]" : "bg-black text-white/50 border-white/10")}>
                                        <Cylinder className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between gap-2 mt-0 shrink-0 bg-black/40 p-2 rounded-lg border border-white/5">
                                <label className="text-[10px] text-magenta-500/80 uppercase font-bold tracking-widest pl-2">Danger</label>
                                <div className="flex gap-2">
                                     <button onClick={() => sendMessage({ type: 'WALLS_CLEARED' })} className="flex items-center gap-2 px-4 py-3 text-xs rounded bg-red-500/20 border border-red-500/50 text-red-400">
                                         <Trash2 className="w-4 h-4" /> Walls
                                     </button>
                                     <button onClick={() => sendMessage({ type: 'OBJECTS_CLEARED' })} className="flex items-center gap-2 px-4 py-3 text-xs rounded bg-red-500/20 border border-red-500/50 text-red-400">
                                         <Trash2 className="w-4 h-4" /> Objs
                                     </button>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-4 mt-0 shrink-0 bg-black/40 p-3 rounded-lg border border-white/5">
                             <div className="flex-1">
                                 <label className="text-[10px] text-cyan-500/80 uppercase font-bold tracking-widest mb-2 block">X Gravity</label>
                                 <input 
                                     type="range" min="-5" max="5" step="0.1" value={gravity[0]} 
                                     onChange={(e) => { 
                                         const val = parseFloat(e.target.value);
                                         setGravity([val, -9.81, gravity[2]]);
                                         sendMessage({ type: 'CONTROL_ACTION', payload: { action: 'gravity', x: val, z: gravity[2] } });
                                     }}
                                     className="w-full h-2 bg-black rounded-lg appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400"
                                 />
                             </div>
                             <div className="flex-1">
                                 <label className="text-[10px] text-cyan-500/80 uppercase font-bold tracking-widest mb-2 block">Z Gravity</label>
                                 <input 
                                     type="range" min="-5" max="5" step="0.1" value={gravity[2]} 
                                     onChange={(e) => { 
                                         const val = parseFloat(e.target.value);
                                         setGravity([gravity[0], -9.81, val]);
                                         sendMessage({ type: 'CONTROL_ACTION', payload: { action: 'gravity', x: gravity[0], z: val } });
                                     }}
                                     className="w-full h-2 bg-black rounded-lg appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400"
                                 />
                             </div>
                        </div>

                        <div className="flex gap-2 mt-0 overflow-x-auto no-scrollbar pb-2 shrink-0">
                             <div className="flex items-center gap-2 bg-black/40 p-2 rounded-lg border border-white/5 flex-shrink-0">
                                 <label className="text-[10px] text-cyan-500/80 uppercase font-bold tracking-widest pl-2">Scale</label>
                                 <select 
                                    className="bg-black text-white text-xs p-2 rounded border border-white/10 outline-none w-28"
                                    value={currentScale}
                                    onChange={(e) => {
                                        setCurrentScale(e.target.value);
                                        sendMessage({ type: 'CONTROL_ACTION', payload: { action: 'scale', scale: e.target.value } });
                                    }}
                                 >
                                     {Object.keys(SCALES).map(s => <option key={s} value={s}>{s}</option>)}
                                 </select>
                             </div>
                             <div className="flex items-center gap-2 bg-black/40 p-2 rounded-lg border border-white/5 flex-shrink-0">
                                 <label className="text-[10px] text-cyan-500/80 uppercase font-bold tracking-widest pl-2">Cam</label>
                                 <select 
                                    className="bg-black text-white text-xs p-2 rounded border border-white/10 outline-none w-28"
                                    value={viewMode}
                                    onChange={(e) => {
                                        setViewMode(e.target.value as ViewMode);
                                        sendMessage({ type: 'CONTROL_ACTION', payload: { action: 'viewMode', mode: e.target.value as ViewMode } });
                                    }}
                                 >
                                     {Object.values(ViewMode).map(v => <option key={v} value={v}>{v}</option>)}
                                 </select>
                             </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

const App: React.FC = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      setSessionId(params.get('session'));
  }, []);

  if (sessionId) {
      return <ClientApp sessionId={sessionId} />;
  }

  return <HostApp />;
};

export default App;