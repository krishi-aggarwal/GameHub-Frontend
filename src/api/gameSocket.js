import {
  Client,
} from '@stomp/stompjs';

import SockJS from 'sockjs-client';

/*
 * WebSocket connection manager for GameHub.
 *
 * One connection is used for the current game session.
 */

let client = null;

export function connectToGame(
  sessionId,
  onEvent,
  token
) {

  /*
   * Close an existing connection first.
   */
  disconnectFromGame();

  client = new Client({

    /*
     * SockJS connects to the Spring Boot
     * WebSocket endpoint.
     */
    webSocketFactory: () =>
      new SockJS(
        'http://localhost:8080/ws'
      ),

    reconnectDelay: 5000,

    /*
     * Send JWT during STOMP connection.
     *
     * This will work once the backend WebSocket
     * authentication interceptor is connected.
     */
    connectHeaders: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {},

    onConnect: () => {

      console.log(
        'GameHub WebSocket connected'
      );

      client.subscribe(
        `/topic/game/${sessionId}`,
        (message) => {

          try {

            const event =
              JSON.parse(message.body);

            onEvent?.(event);

          } catch (error) {

            console.error(
              'Failed to parse game event:',
              error
            );

          }
        }
      );
    },

    onStompError: (frame) => {

      console.error(
        'GameHub STOMP error:',
        frame.headers['message']
      );
    },

    onWebSocketError: (error) => {

      console.error(
        'GameHub WebSocket error:',
        error
      );
    },

  });

  client.activate();
}

export function sendChatMessage(
  sessionId,
  message
) {

  if (!client?.connected) {
    console.warn(
      'Cannot send chat: WebSocket disconnected.'
    );

    return;
  }

  client.publish({

    destination:
      `/app/game/${sessionId}/chat`,

    body: JSON.stringify({
      message,
    }),

  });
}

export function disconnectFromGame() {

  if (client) {

    client.deactivate();

    client = null;
  }
}