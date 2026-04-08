import React, { useState, useEffect, useRef } from 'react';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import { v4 as uuidv4 } from 'uuid';
import * as THREE from 'three';

import { World } from './World';
import { MusicalSphere, MusicalBox, CustomWall, GhostWall } from './InteractiveObjects';
import { audioEngine } from '../utils/audio';
import { PhysicalObject, WallData, ShapeType, SPAWN_HEIGHT, ViewMode, InteractionMode, CAMERAS, WALL_HEIGHT } from '../constants';

interface OrchestraProps {
    gravity: [number, number, number];
    viewMode: ViewMode;
    interactionMode: InteractionMode;
    projectionMode: boolean;
    onClearWalls: () => void;
    clearTrigger: number; // Increment to trigger clear
}

const CameraManager: React.FC<{ mode: ViewMode }> = ({ mode }) => {
    const { camera } = useThree();
    
    useEffect(() => {
        const target = CAMERAS[mode];
        if (target) {
            camera.position.set(...target.position as [number, number, number]);
            if (camera instanceof THREE.PerspectiveCamera) {
                camera.fov = target.fov;
                camera.updateProjectionMatrix();
            }
            camera.lookAt(0, 0, 0);
        }
    }, [mode, camera]);

    return null;
};

export const Orchestra: React.FC<OrchestraProps> = ({ gravity, viewMode, interactionMode, projectionMode, clearTrigger }) => {
  const [objects, setObjects] = useState<PhysicalObject[]>([]);
  const [walls, setWalls] = useState<WallData[]>([]);
  
  // Building State
  const [isDrawing, setIsDrawing] = useState(false);
  const dragStart = useRef<[number, number, number] | null>(null);
  const [dragEnd, setDragEnd] = useState<[number, number, number] | null>(null);

  // Clear walls when trigger changes
  useEffect(() => {
      if (clearTrigger > 0) setWalls([]);
  }, [clearTrigger]);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      // Ensure audio starts on first interaction
      if (!audioEngine.ready()) audioEngine.init();

      if (interactionMode === InteractionMode.SPAWN) {
          spawnObject(e.point);
      } else {
          // Start Drawing
          setIsDrawing(true);
          // Snap to gridish? No, keep it freeform.
          dragStart.current = [e.point.x, 0, e.point.z];
          setDragEnd([e.point.x, 0, e.point.z]);
      }
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
      if (interactionMode === InteractionMode.BUILD && isDrawing && dragStart.current) {
          e.stopPropagation();
          setDragEnd([e.point.x, 0, e.point.z]);
      }
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
      if (interactionMode === InteractionMode.BUILD && isDrawing && dragStart.current && dragEnd) {
          e.stopPropagation();
          setIsDrawing(false);
          
          const start = dragStart.current;
          const end = [e.point.x, 0, e.point.z];

          const width = Math.abs(end[0] - start[0]);
          const depth = Math.abs(end[2] - start[2]);

          // Prevent tiny accidental walls
          if (width > 0.2 || depth > 0.2) {
              const centerX = (start[0] + end[0]) / 2;
              const centerZ = (start[2] + end[2]) / 2;

              const newWall: WallData = {
                  id: uuidv4(),
                  position: [centerX, WALL_HEIGHT / 2, centerZ],
                  args: [Math.max(width, 0.2), WALL_HEIGHT, Math.max(depth, 0.2)],
              };
              setWalls(prev => [...prev, newWall]);
          }

          dragStart.current = null;
          setDragEnd(null);
      }
  };

  const spawnObject = (point: THREE.Vector3) => {
    const type = Math.random() > 0.5 ? ShapeType.BOX : ShapeType.SPHERE;
    // Spawn roughly above where clicked, but high up
    const spawnX = Math.max(-4, Math.min(4, point.x));
    const spawnZ = Math.max(-4, Math.min(4, point.z));
    
    const newObject: PhysicalObject = {
      id: uuidv4(),
      type,
      position: [spawnX, SPAWN_HEIGHT + Math.random() * 2, spawnZ],
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
    };

    setObjects((prev) => [...prev, newObject]);
  };

  return (
    <>
      <CameraManager mode={viewMode} />
      
      {/* Interaction Plane */}
      <mesh 
        position={[0, 0, 0]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        visible={false}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Ghost Wall Preview */}
      {isDrawing && dragStart.current && dragEnd && (
          <GhostWall start={dragStart.current} end={dragEnd} height={WALL_HEIGHT} />
      )}

      <Physics gravity={gravity} allowSleep={false} iterations={15} tolerance={0.0001}>
        <World projectionMode={projectionMode} />
        
        {/* Dynamic User-Created Walls */}
        {walls.map(wall => (
            <CustomWall key={wall.id} data={wall} />
        ))}

        {/* Falling Objects */}
        {objects.map((obj) => (
          <React.Fragment key={obj.id}>
            {obj.type === ShapeType.SPHERE ? (
              <MusicalSphere data={obj} audio={audioEngine} />
            ) : (
              <MusicalBox data={obj} audio={audioEngine} />
            )}
          </React.Fragment>
        ))}
      </Physics>
    </>
  );
};