// Visuals
export const COLORS = {
    WALL: '#0A1A3F', // Deep Royal Blue
    WOOD: '#D2B48C', // Tan/Sand
    MARBLE: '#FFFFFF',
    LIGHT_MAGENTA: '#FF00FF',
    LIGHT_CYAN: '#00FFFF',
    LIGHT_MAIN: '#FFFFFF',
    GHOST: '#4ADE80', // Green for building preview
    EMISSIVE_SPHERE: '#00FFFF',
    EMISSIVE_BOX: '#FF00FF',
};

// Physics
export const GRAVITY: [number, number, number] = [0, -9.81, 0];
export const BOUNCINESS = 0.8;
export const SPAWN_HEIGHT = 8;
export const VELOCITY_THRESHOLD = 0.5;
export const WALL_HEIGHT = 3;

// Shapes
export enum ShapeType {
    BOX = 'BOX',
    SPHERE = 'SPHERE',
    CYLINDER = 'CYLINDER',
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
export const SCALES = {
    PENTATONIC: ['C3', 'D#3', 'F3', 'G3', 'A#3', 'C4', 'D#4', 'F4'],
    MINOR: ['C3', 'D3', 'D#3', 'F3', 'G3', 'G#3', 'A#3', 'C4'],
    WHOLE_TONE: ['C3', 'D3', 'E3', 'F#3', 'G#3', 'A#3', 'C4', 'D4'],
    DREAMY: ['C4', 'E4', 'G4', 'B4', 'D5', 'F#5', 'A5', 'C6'],
};

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
    [ViewMode.TOP]: { position: [0, 16, 0], fov: 45 },
    [ViewMode.CCTV]: { position: [8, 8, 8], fov: 60 },
};
