import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export type PeerMode = 'host' | 'client';

export interface PeerMessage {
  type: 'WALL_ADDED' | 'WALLS_CLEARED' | 'OBJECT_SPAWNED' | 'OBJECTS_CLEARED' | 'STATE_SYNC' | 'CONTROL_ACTION' | 'DRAW_START' | 'DRAW_MOVE' | 'DRAW_END' | 'DELETE_WALL';
  payload?: any;
}

export function usePeerManager(mode: PeerMode, initialSessionId?: string) {
  const [peerId, setPeerId] = useState<string | null>(null);
  
  // To keep compatible with the App.tsx API, connections will just be a dummy array [true] when connected
  const [connections, setConnections] = useState<any[]>([]);
  const [lastMessage, setLastMessage] = useState<PeerMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Initializing');
  const socketRef = useRef<Socket | null>(null);
  const roomIdRef = useRef<string | null>(null);

  useEffect(() => {
    setStatus('Connecting to WebSocket server...');
    const socket = io(window.location.origin, {
       transports: ['websocket', 'polling'],
       reconnectionAttempts: 5
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      let roomId = '';
      if (mode === 'host') {
        // Generate a random 6 char room ID for host
        roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        setPeerId(roomId);
        setStatus(`Host room created: ${roomId}`);
      } else {
        roomId = initialSessionId || '';
        setPeerId(roomId);
        setStatus(`Joined room: ${roomId}`);
        // As a client, once connected to room, we consider ourselves "connected"
        setConnections([true]);
      }
      roomIdRef.current = roomId;
      socket.emit('join_room', roomId);
    });

    socket.on('client_joined', () => {
        if (mode === 'host') {
           setConnections(prev => [...prev, true]);
        }
    });

    socket.on('peer_message', (message: PeerMessage) => {
        setLastMessage(message);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket.IO Error:', err);
      setError(`${err.message} (Is the server reachable?)`);
      setStatus(`Socket Error: ${err.message}`);
    });

    socket.on('disconnect', () => {
      setStatus('Disconnected');
      setConnections([]);
    });

    return () => {
      socket.disconnect();
    };
  }, [mode, initialSessionId]);

  const sendMessage = useCallback((message: PeerMessage) => {
    if (socketRef.current && roomIdRef.current) {
      socketRef.current.emit('peer_message', {
         roomId: roomIdRef.current,
         message
      });
    }
  }, []);

  return { peerId, connections, lastMessage, sendMessage, error, status };
}
