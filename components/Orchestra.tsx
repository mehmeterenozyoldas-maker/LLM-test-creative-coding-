import React, { useState, useEffect, useRef } from 'react';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { v4 as uuidv4 } from 'uuid';
import * as THREE from 'three';

import { World } from './World';
import { MusicalSphere, MusicalBox, CustomWall, GhostWall, MusicalCylinder } from './InteractiveObjects';
import { audioEngine } from '../utils/audio';
import { PhysicalObject, WallData, ShapeType, SPAWN_HEIGHT, ViewMode, InteractionMode, CAMERAS, WALL_HEIGHT } from '../constants';

interface OrchestraProps {
    gravity: [number, number, number];
    viewMode: ViewMode;
    interactionMode: InteractionMode;
    projectionMode: boolean;
    selectedShape: ShapeType;
    onClearWalls: () => void;
    clearTrigger: number;
    clearObjectsTrigger: number;
    initialWalls?: WallData[];
    initialObjects?: PhysicalObject[];
    onWallsUpdate?: (walls: WallData[]) => void;
    onObjectsUpdate?: (objects: PhysicalObject[]) => void;
    spawnObjectTrigger?: PhysicalObject | null;
    deleteWallTrigger?: string | null;
    remoteDrawState?: { state: 'start' | 'move' | 'end', point: [number, number, number] } | null;
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

export const Orchestra: React.FC<OrchestraProps> = ({ 
    gravity, viewMode, interactionMode, projectionMode, selectedShape, 
    clearTrigger, clearObjectsTrigger, initialWalls = [], initialObjects = [], 
    onWallsUpdate, onObjectsUpdate, spawnObjectTrigger, deleteWallTrigger, remoteDrawState 
}) => {
  const [objects, setObjects] = useState<PhysicalObject[]>(initialObjects);
  const [walls, setWalls] = useState<WallData[]>(initialWalls);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const dragStart = useRef<[number, number, number] | null>(null);
  const [dragEnd, setDragEnd] = useState<[number, number, number] | null>(null);

  useEffect(() => {
      if (initialWalls.length > 0 && walls.length === 0) setWalls(initialWalls);
  }, [initialWalls]);

  useEffect(() => {
      if (deleteWallTrigger) {
          setWalls(prev => {
              const next = prev.filter(w => w.id !== deleteWallTrigger);
              onWallsUpdate?.(next);
              return next;
          });
      }
  }, [deleteWallTrigger]);

  useEffect(() => {
      if (remoteDrawState) {
          const { state, point } = remoteDrawState;
          if (state === 'start') {
              setIsDrawing(true);
              dragStart.current = point;
              setDragEnd(point);
          } else if (state === 'move') {
              if (dragStart.current) {
                  setDragEnd(point);
              }
          } else if (state === 'end') {
              if (dragStart.current) {
                  const start = dragStart.current;
                  const end = point;
                  const width = Math.abs(end[0] - start[0]);
                  const depth = Math.abs(end[2] - start[2]);

                  if (width > 0.2 || depth > 0.2) {
                      const centerX = (start[0] + end[0]) / 2;
                      const centerZ = (start[2] + end[2]) / 2;
                      const newWall: WallData = {
                          id: uuidv4(),
                          position: [centerX, WALL_HEIGHT / 2, centerZ],
                          args: [Math.max(width, 0.2), WALL_HEIGHT, Math.max(depth, 0.2)],
                      };
                      setWalls(prev => {
                          const next = [...prev, newWall];
                          onWallsUpdate?.(next);
                          return next;
                      });
                  }
              }
              setIsDrawing(false);
              dragStart.current = null;
              setDragEnd(null);
          }
      }
  }, [remoteDrawState]);
  
  useEffect(() => {
      if (initialObjects.length > 0 && objects.length === 0) setObjects(initialObjects);
  }, [initialObjects]);

  useEffect(() => {
      if (spawnObjectTrigger) {
          setObjects(prev => {
              const next = [...prev, spawnObjectTrigger];
              onObjectsUpdate?.(next);
              return next;
          });
      }
  }, [spawnObjectTrigger]);

  useEffect(() => {
      if (clearTrigger > 0) {
          setWalls([]);
          onWallsUpdate?.([]);
      }
  }, [clearTrigger]);

  useEffect(() => {
      if (clearObjectsTrigger > 0) {
          setObjects([]);
          onObjectsUpdate?.([]);
      }
  }, [clearObjectsTrigger]);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (!audioEngine.ready()) audioEngine.init();

      if (interactionMode === InteractionMode.SPAWN) {
          spawnObject(e.point);
      } else {
          setIsDrawing(true);
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

          if (width > 0.2 || depth > 0.2) {
              const centerX = (start[0] + end[0]) / 2;
              const centerZ = (start[2] + end[2]) / 2;

              const newWall: WallData = {
                  id: uuidv4(),
                  position: [centerX, WALL_HEIGHT / 2, centerZ],
                  args: [Math.max(width, 0.2), WALL_HEIGHT, Math.max(depth, 0.2)],
              };
              setWalls(prev => {
                  const next = [...prev, newWall];
                  onWallsUpdate?.(next);
                  return next;
              });
          }

          dragStart.current = null;
          setDragEnd(null);
      }
  };

  const spawnObject = (point: THREE.Vector3) => {
    // Limits spawn slightly inside the full walls to prevent spawning through them
    const spawnX = Math.max(-14, Math.min(14, point.x));
    const spawnZ = Math.max(-9, Math.min(9, point.z));
    
    // Spread objects slightly in Y locally if multiple spawning quickly
    const newObject: PhysicalObject = {
      id: uuidv4(),
      type: selectedShape,
      position: [spawnX, SPAWN_HEIGHT + Math.random(), spawnZ],
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
    };

    setObjects((prev) => {
        const next = [...prev, newObject];
        onObjectsUpdate?.(next);
        return next;
    });
  };

  return (
    <>
      <CameraManager mode={viewMode} />
      
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

      {isDrawing && dragStart.current && dragEnd && (
          <GhostWall start={dragStart.current} end={dragEnd} height={WALL_HEIGHT} />
      )}

      <Physics gravity={gravity} allowSleep={false} iterations={15} tolerance={0.0001}>
        <World />
        
        {walls.map(wall => (
            <CustomWall key={wall.id} data={wall} />
        ))}

        {objects.map((obj) => {
          if (obj.type === ShapeType.SPHERE) return <MusicalSphere key={obj.id} data={obj} audio={audioEngine} />;
          if (obj.type === ShapeType.CYLINDER) return <MusicalCylinder key={obj.id} data={obj} audio={audioEngine} />;
          return <MusicalBox key={obj.id} data={obj} audio={audioEngine} />;
        })}
      </Physics>

      <EffectComposer disableNormalPass multisampling={0}>
        <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.9} intensity={1.5} />
        <Noise opacity={0.02} />
        <Vignette eskil={false} offset={0.1} darkness={0.9} />
      </EffectComposer>
    </>
  );
};