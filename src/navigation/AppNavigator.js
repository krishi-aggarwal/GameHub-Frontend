import React from 'react';
import {
  ActivityIndicator,
  View,
} from 'react-native';

import {
  NavigationContainer,
} from '@react-navigation/native';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

// AUTH


// GAMEHUB

import GameCatalogScreen from '../screens/games/GameCatalogScreen';
import FishpondScreen from '../screens/games/FishpondScreen';
import PassAndPlayScreen from '../screens/games/PassAndPlayScreen';
import TutorialScreen from '../screens/tutorial/TutorialScreen';

// ROOMS
import CreateRoomScreen from '../screens/room/CreateRoomScreen';
import JoinRoomScreen from '../screens/room/JoinRoomScreen';
import LobbyScreen from '../screens/room/LobbyScreen';

// DECEPTION AROUND US
import NightScreen from '../screens/deception/NightScreen';
import DayScreen from '../screens/deception/DayScreen';
import VotingScreen from '../screens/deception/VotingScreen';
import ObserverScreen from '../screens/deception/ObserverScreen';
import GameOverScreen from '../screens/deception/GameOverScreen';

// ADMIN
import AdminCreateGameScreen from '../screens/admin/AdminCreateGameScreen';
import AdminGamesScreen from '../screens/admin/AdminGamesScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import HomeScreen from '../screens/home/HomeScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import colors from '../theme/colors';
import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const {
    activeRoomCode,
    activePassPlay,
    isAuthenticated,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={
          isAuthenticated
            ? activePassPlay
              ? 'PassAndPlay'
              : activeRoomCode
                ? 'Lobby'
                : 'Home'
            : 'Login'
        }
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        {/* AUTHENTICATION */}

        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />

        <Stack.Screen
          name="Register"
          component={RegisterScreen}
        />

        {/* GAMEHUB PLATFORM */}

        <Stack.Screen
          name="Home"
          component={HomeScreen}
        />

        <Stack.Screen
          name="GameCatalog"
          component={GameCatalogScreen}
        />

        <Stack.Screen
          name="Fishpond"
          component={FishpondScreen}
          options={{ gestureEnabled: false }}
        />

        <Stack.Screen
          name="PassAndPlay"
          component={PassAndPlayScreen}
          initialParams={
            activePassPlay
              ? { gameSlug: activePassPlay }
              : undefined
          }
          options={{ gestureEnabled: false }}
        />

        <Stack.Screen
          name="Tutorial"
          component={TutorialScreen}
        />

        {/* ROOM SYSTEM */}

        <Stack.Screen
          name="CreateRoom"
          component={CreateRoomScreen}
        />

        <Stack.Screen
          name="JoinRoom"
          component={JoinRoomScreen}
        />

        <Stack.Screen
          name="Lobby"
          component={LobbyScreen}
          initialParams={
            isAuthenticated && activeRoomCode
              ? { roomCode: activeRoomCode }
              : undefined
          }
        />

        {/* DECEPTION AROUND US */}

        <Stack.Screen
          name="Night"
          component={NightScreen}
          options={{
            gestureEnabled: false,
          }}
        />

        <Stack.Screen
          name="Day"
          component={DayScreen}
          options={{
            gestureEnabled: false,
          }}
        />

        <Stack.Screen
          name="Voting"
          component={VotingScreen}
          options={{
            gestureEnabled: false,
          }}
        />

        <Stack.Screen
          name="Observer"
          component={ObserverScreen}
          options={{
            gestureEnabled: false,
          }}
        />

        <Stack.Screen
          name="GameOver"
          component={GameOverScreen}
          options={{
            gestureEnabled: false,
          }}
        />

        {/* ADMIN */}

        <Stack.Screen
          name="AdminCreateGame"
          component={AdminCreateGameScreen}
        />

        <Stack.Screen
          name="AdminGames"
          component={AdminGamesScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}