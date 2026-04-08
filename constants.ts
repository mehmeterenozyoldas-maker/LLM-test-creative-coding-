// Visuals
export const COLORS = {
    WALL: '#0A1A3F', // Deep Royal Blue
    WOOD: '#D2B48C', // Tan/Sand
    MARBLE: '#FFFFFF',
    LIGHT_MAGENTA: '#FF00FF',
    LIGHT_CYAN: '#00FFFF',
    LIGHT_MAIN: '#FFFFFF',
    GHOST: '#4ADE80', // Green for building preview
};

// Physics
export const GRAVITY: [number, number, number] = [0, -9.81, 0];
export const BOUNCINESS = 0.6;
export const SPAWN_HEIGHT = 6;
export const VELOCITY_THRESHOLD = 1.5;
export const WALL_HEIGHT = 2;

// Shapes
export enum ShapeType {
    BOX = 'BOX',
    SPHERE = 'SPHERE',
}

export interface PhysicalObject {
    id: string;
    type: ShapeType;
    position: [number, number, number];
    rotation: [number, number, number];
}

export interface WallData {
    id: string;
    position: [number, number, number];
    args: [number, number, number]; // Width, Height, Depth
}

// Audio
export const SCALE = ['C3', 'D#3', 'F3', 'G3', 'A#3', 'C4'];

// View Configuration
export enum ViewMode {
    DIRECTOR = 'DIRECTOR',
    TOP = 'TOP',
    CCTV = 'CCTV',
}

export enum InteractionMode {
    SPAWN = 'SPAWN',
    BUILD = 'BUILD',
}

export const CAMERAS = {
    [ViewMode.DIRECTOR]: { position: [0, 5, 12], fov: 45 },
    [ViewMode.TOP]: { position: [0, 15, 0], fov: 35 },
    [ViewMode.CCTV]: { position: [8, 8, 8], fov: 60 },
};