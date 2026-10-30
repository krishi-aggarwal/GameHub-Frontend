import { Client } from '@stomp/stompjs';
import { BACKEND_URL } from './api';

let gameClient = null;
let roomClient = null;
let gameToken = null;
let roomToken = null;

const WS_URL = `${BACKEND_URL.replace(/^http/, 'ws')}/ws`;

/**
 * Creates and configures a STOMP client instance.
 */
function createClient(token, onConnect, onError) {
  const client = new Client({
    brokerURL: WS_URL,
    reconnectDelay: 3000,
    connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    onConnect: () => {
      console.log('GameHub WebSocket connected');
      onConnect?.(client);
    },
    onWebSocketError: (error) => {
      console.error('GameHub WebSocket error:', error);
      onError?.(error);
    },
    onWebSocketClose: () => {
      console.log('GameHub WebSocket closed');
    },
  });

  return client;
}

/**
 * Connects to a specific game session topic.
 */
export function connectToGame(sessionId, onEvent, token) {
  disconnectFromGame();
  gameToken = token;

  const client = createClient(token, (connectedClient) => {
    const destination = `/topic/game/${sessionId}`;
    
    connectedClient.subscribe(destination, (message) => {
      try {
        const event = JSON.parse(message.body);
        console.log('GameHub Game Event:', event);
        onEvent?.(event);
      } catch (error) {
        console.error('Failed to parse game event:', error);
      }
    });
    
    console.log('Subscribed to:', destination);
  });

  gameClient = client;
  client.activate();
}

/**
 * Connects to a specific game room topic.
 */
export function connectToRoom(roomCode, onEvent, token) {
  disconnectFromRoom();
  roomToken = token;

  const client = createClient(token, (connectedClient) => {
    const destination = `/topic/room/${roomCode}`;
    
    connectedClient.subscribe(destination, (message) => {
      try {
        const event = JSON.parse(message.body);
        onEvent?.(event);
      } catch (error) {
        console.error('Failed to parse room event:', error);
      }
    });
  });

  roomClient = client;
  client.activate();
}

/**
 * Publishes a chat message payload to a specific game session.
 */
export function sendChatMessage(sessionId, message) {
  if (!gameClient || !gameClient.connected) {
    console.warn('Cannot send chat: WebSocket not connected');
    return false;
  }
  
  if (!gameToken) {
    console.warn('Cannot send chat: JWT token unavailable');
    return false;
  }

  const trimmedMessage = String(message || '').trim();
  if (!trimmedMessage) {
    return false;
  }

  gameClient.publish({
    destination: `/app/game/${sessionId}/chat`,
    headers: {
      Authorization: `Bearer ${gameToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      message: trimmedMessage,
    }),
  });

  return true;
}

/**
 * Disconnects and resets the active game connection context.
 */
export function disconnectFromGame() {
  const client = gameClient;
  gameClient = null;
  gameToken = null;
  if (client) {
    client.deactivate();
  }
}

/**
 * Disconnects and resets the active room connection context.
 */
export function disconnectFromRoom() {
  const client = roomClient;
  roomClient = null;
  roomToken = null;
  if (client) {
    client.deactivate();
  }
}

/**
 * Tears down all active WebSocket connections across the module.
 */
export function disconnectAllSockets() {
  disconnectFromGame();
  disconnectFromRoom();
}
