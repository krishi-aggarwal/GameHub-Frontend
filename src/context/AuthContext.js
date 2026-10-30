
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);

const TOKEN_KEY = 'gamehub_token';
const USER_KEY = 'gamehub_user';
const ACTIVE_ROOM_KEY = 'gamehub_active_room';
const ACTIVE_PASS_PLAY_KEY = 'gamehub_active_pass_play';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [activeRoomCode, setActiveRoomCodeState] = useState(null);
  const [activePassPlay, setActivePassPlayState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    try {
      const storedToken =
        await AsyncStorage.getItem(TOKEN_KEY);

      const storedUser =
        await AsyncStorage.getItem(USER_KEY);

      const storedRoomCode =
        await AsyncStorage.getItem(ACTIVE_ROOM_KEY);
      const storedPassPlay =
        await AsyncStorage.getItem(ACTIVE_PASS_PLAY_KEY);

      if (storedToken) {
        setToken(storedToken);
      }

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      if (storedRoomCode) {
        setActiveRoomCodeState(storedRoomCode);
      }
      if (storedPassPlay) {
        setActivePassPlayState(storedPassPlay);
      }
    } catch (error) {
      console.error(
        'Failed to load authentication:',
        error
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveAuth(
    authToken,
    userData
  ) {
    await AsyncStorage.setItem(
      TOKEN_KEY,
      authToken
    );

    await AsyncStorage.setItem(
      USER_KEY,
      JSON.stringify(userData)
    );

    setToken(authToken);
    setUser(userData);
  }

  async function logout() {
    await AsyncStorage.removeItem(
      TOKEN_KEY
    );

    await AsyncStorage.removeItem(
      USER_KEY
    );

    await AsyncStorage.removeItem(
      ACTIVE_ROOM_KEY
    );
    await AsyncStorage.removeItem(
      ACTIVE_PASS_PLAY_KEY
    );

    setToken(null);
    setUser(null);
    setActiveRoomCodeState(null);
    setActivePassPlayState(null);
  }

  async function setActiveRoomCode(roomCode) {
    const normalizedRoomCode = roomCode?.trim().toUpperCase() || null;
    setActiveRoomCodeState(normalizedRoomCode);

    try {
      if (normalizedRoomCode) {
        await AsyncStorage.removeItem(ACTIVE_PASS_PLAY_KEY);
        setActivePassPlayState(null);
        await AsyncStorage.setItem(ACTIVE_ROOM_KEY, normalizedRoomCode);
      } else {
        await AsyncStorage.removeItem(ACTIVE_ROOM_KEY);
      }
    } catch (error) {
      console.error('Failed to persist active room:', error);
    }
  }

  async function setActivePassPlay(gameSlug) {
    setActivePassPlayState(gameSlug || null);

    try {
      await AsyncStorage.removeItem(ACTIVE_ROOM_KEY);
      setActiveRoomCodeState(null);
      if (gameSlug) {
        await AsyncStorage.setItem(ACTIVE_PASS_PLAY_KEY, gameSlug);
      } else {
        await AsyncStorage.removeItem(ACTIVE_PASS_PLAY_KEY);
      }
    } catch (error) {
      console.error('Failed to persist pass-and-play state:', error);
    }
  }

  const role =
    user?.role ||
    user?.roles?.[0] ||
    null;

  const isAdmin =
    role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        activeRoomCode,
        activePassPlay,
        role,
        isAdmin,
        loading,
        isAuthenticated: !!token,
        saveAuth,
        logout,
        setActiveRoomCode,
        setActivePassPlay,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

