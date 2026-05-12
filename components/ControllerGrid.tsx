import React, { useRef, useState, useEffect } from 'react';
import { WallData, InteractionMode } from '../constants';
import { cn } from '../utils/cn';

interface ControllerGridProps {
  walls: WallData[];
  interactionMode: InteractionMode;
  onDrawStart: (point: [number, number, number]) => void;
  onDrawMove: (point: [number, number, number]) => void;
  onDrawEnd: (point: [number, number, number]) => void;
  onDeleteWall: (id: string) => void;
  onSpawnObject: (point: [number, number, number]) => void;
}

export const ControllerGrid: React.FC<ControllerGridProps> = ({
  walls,
  interactionMode,
  onDrawStart,
  onDrawMove,
  onDrawEnd,
  onDeleteWall,
  onSpawnObject,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [dragStart, setDragStart] = useState<[number, number, number] | null>(null);
  const [dragEnd, setDragEnd] = useState<[number, number, number] | null>(null);

  const getPoint = (clientX: number, clientY: number): [number, number, number] | null => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 20 - 10;
    const z = ((clientY - rect.top) / rect.height) * 20 - 10;
    return [x, 0, z];
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (e.target !== containerRef.current) return; // Prevent triggering below a wall if tapping on it
    const point = getPoint(e.clientX, e.clientY);
    if (!point) return;

    if (interactionMode === InteractionMode.SPAWN) {
      onSpawnObject(point);
    } else {
      setIsDrawing(true);
      setDragStart(point);
      setDragEnd(point);
      onDrawStart(point);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const point = getPoint(e.clientX, e.clientY);
    if (!point) return;
    setDragEnd(point);
    onDrawMove(point);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const point = getPoint(e.clientX, e.clientY);
    if (point) {
      onDrawEnd(point);
    }
    setIsDrawing(false);
    setDragStart(null);
    setDragEnd(null);
  };

  return (
    <div 
      ref={containerRef}
      className="flex-1 w-full bg-[#050b1d] border border-cyan-500/20 rounded-xl relative overflow-hidden touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ backgroundImage: 'radial-gradient(circle at 100% 100%, #ffffff05 1px, transparent 1px)', backgroundSize: '10% 10%' }}
    >
      <div className="absolute top-2 left-2 text-[10px] text-white/30 font-mono pointer-events-none">INTERACTIVE GRID</div>

      {walls.map((w) => {
        const x = w.position[0];
        const z = w.position[2];
        const wX = w.args[0];
        const wZ = w.args[2];
        return (
          <div
            key={w.id}
            className="absolute bg-magenta-500/50 outline outline-1 outline-magenta-400 cursor-pointer hover:bg-red-500/80 transition-colors flex items-center justify-center group"
            style={{
              left: `${((x + 10) / 20) * 100}%`,
              top: `${((z + 10) / 20) * 100}%`,
              width: `${(wX / 20) * 100}%`,
              height: `${(wZ / 20) * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onDeleteWall(w.id);
            }}
          >
              <div className="hidden group-hover:block text-white font-bold text-xs">✕</div>
          </div>
        );
      })}

      {isDrawing && dragStart && dragEnd && (
        <div
          className="absolute bg-green-400/50 outline outline-1 outline-green-400 border border-green-500"
          style={{
            left: `${((Math.min(dragStart[0], dragEnd[0]) + 10) / 20) * 100}%`,
            top: `${((Math.min(dragStart[2], dragEnd[2]) + 10) / 20) * 100}%`,
            width: `${(Math.abs(dragEnd[0] - dragStart[0]) / 20) * 100}%`,
            height: `${(Math.abs(dragEnd[2] - dragStart[2]) / 20) * 100}%`,
          }}
        />
      )}
    </div>
  );
};
