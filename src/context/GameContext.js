import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  getGameState,
} from '../api/deceptionApi';

import {
  connectToGame,
  disconnectFromGame,
} from '../api/gameSocket';

import {
  useAuth,
} from './AuthContext';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const { token, user } = useAuth();

  /*
   * Current Deception game session.
   */
  const [sessionId, setSessionId] =
    useState(null);

  /*
   * Complete role-safe game state.
   */
  const [gameState, setGameState] =
    useState(null);

  /*
   * Latest WebSocket event.
   */
  const [lastEvent, setLastEvent] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState(null);

  /*
   * Fetch complete game state.
   */
  const fetchGameState =
    useCallback(
      async (currentSessionId) => {

        if (!currentSessionId) {
          return null;
        }

        try {

          setLoading(true);
          setError(null);

          const data =
            await getGameState(
              currentSessionId
            );

          console.log(
            'GAME STATE:',
            data
          );

          setGameState(data);

          return data;

        } catch (err) {

          console.error(
            'Failed to fetch game state:',
            err
          );

          setError(err);

          throw err;

        } finally {

          setLoading(false);
        }
      },
      []
    );

  /*
   * Enter game session.
   */
  const enterGame =
    useCallback(
      async (newSessionId) => {

        if (!newSessionId) {
          throw new Error(
            'Session ID is required.'
          );
        }

        setSessionId(
          newSessionId
        );

        /*
         * Fetch initial state.
         */
        const state =
          await fetchGameState(
            newSessionId
          );

        /*
         * Connect to game WebSocket.
         */
        connectToGame(
          newSessionId,
          (event) => {

            console.log(
              'Game event:',
              event
            );

            setLastEvent(event);

            /*
             * Refresh authoritative
             * game state.
             */
            fetchGameState(
              newSessionId
            ).catch(() => {});
          },
          token
        );

        return state;
      },
      [
        fetchGameState,
        token,
      ]
    );

  /*
   * Leave current game.
   */
  const exitGame =
    useCallback(() => {

      disconnectFromGame();

      setSessionId(null);
      setGameState(null);
      setLastEvent(null);
      setError(null);

    }, []);

  /*
   * Cleanup.
   */
  useEffect(() => {

    return () => {
      disconnectFromGame();
    };

  }, []);

  /*
   * Convenient values.
   */
  const gamePhase =
    gameState?.gamePhase ?? null;

  const roundNumber =
    gameState?.roundNumber ?? 1;

  const yourRole =
    gameState?.yourRole ?? null;

  const yourUsername =
    gameState?.yourUsername ?? null;

  const players =
    Array.isArray(gameState?.players)
      ? gameState.players
      : [];

  /*
   * Host information returned by backend.
   */
  const hostUserId =
    gameState?.hostUserId ?? null;

  const hostUsername =
    gameState?.hostUsername ?? null;

  /*
   * Current logged-in user's ID.
   *
   * Support the different shapes used
   * by AuthContext/backend.
   */
  const currentUserId =
    user?.userId ??
    user?.id ??
    user?.userID ??
    user?.user?.userId ??
    user?.user?.id ??
    null;

  const currentUsername =
    user?.username ??
    user?.user?.username ??
    yourUsername ??
    null;

  /*
   * Normalize IDs so that:
   *
   * 123 === "123"
   *
   * This avoids String/Long mismatch.
   */
  const normalizedCurrentUserId =
    currentUserId !== null &&
    currentUserId !== undefined
      ? String(currentUserId)
      : null;

  const normalizedHostUserId =
    hostUserId !== null &&
    hostUserId !== undefined
      ? String(hostUserId)
      : null;

  /*
   * Determine host from authoritative
   * host information.
   *
   * ID is preferred.
   * Username is only a fallback.
   */
  const isHostById =
    normalizedCurrentUserId !== null &&
    normalizedHostUserId !== null &&
    normalizedCurrentUserId ===
      normalizedHostUserId;

  const isHostByUsername =
    !isHostById &&
    currentUsername !== null &&
    hostUsername !== null &&
    String(currentUsername).toLowerCase() ===
      String(hostUsername).toLowerCase();

  /*
   * Final host state.
   *
   * Backend isHost=true is also accepted,
   * but we do NOT depend on it.
   */
  const isHost =
    gameState?.isHost === true ||
    isHostById ||
    isHostByUsername;

  /*
   * Debug information.
   */
  console.log(
    'HOST CHECK:',
    {
      backendIsHost: gameState?.isHost,
      currentUserId,
      hostUserId,
      currentUsername,
      hostUsername,
      isHostById,
      isHostByUsername,
      finalIsHost: isHost,
    }
  );

  const value = {
    sessionId,
    gameState,

    gamePhase,
    roundNumber,
    yourRole,
    yourUsername,

    players,

    isHost,

    hostUserId,
    hostUsername,

    lastEvent,

    loading,
    error,

    enterGame,
    fetchGameState,
    exitGame,
  };

  return (
    <GameContext.Provider
      value={value}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {

  const context =
    useContext(GameContext);

  if (!context) {
    throw new Error(
      'useGame must be used inside GameProvider'
    );
  }

  return context;
}