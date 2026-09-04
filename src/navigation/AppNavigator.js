import React from 'react';

import {
  NavigationContainer,
} from '@react-navigation/native';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

// AUTH
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// GAMEHUB
import HomeScreen from '../screens/home/HomeScreen';
import GameCatalogScreen from '../screens/games/GameCatalogScreen';
import TutorialScreen from '../screens/tutorial/TutorialScreen';

// ROOMS
import CreateRoomScreen from '../screens/room/CreateRoomScreen';
import JoinRoomScreen from '../screens/room/JoinRoomScreen';
import LobbyScreen from '../screens/room/LobbyScreen';

// DECEPTION
import NightScreen from '../screens/deception/NightScreen';
import DayScreen from '../screens/deception/DayScreen';
import VotingScreen from '../screens/deception/VotingScreen';
import ObserverScreen from '../screens/deception/ObserverScreen';
import GameOverScreen from '../screens/deception/GameOverScreen';

// ADMIN
import AdminCreateGameScreen from '../screens/admin/AdminCreateGameScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {

  return (
    <NavigationContainer>

      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >

        {/* =========================
            AUTHENTICATION
        ========================= */}

        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />

        <Stack.Screen
          name="Register"
          component={RegisterScreen}
        />

        {/* =========================
            GAMEHUB PLATFORM
        ========================= */}

        <Stack.Screen
          name="Home"
          component={HomeScreen}
        />

        <Stack.Screen
          name="GameCatalog"
          component={GameCatalogScreen}
        />

        <Stack.Screen
          name="Tutorial"
          component={TutorialScreen}
        />

        {/* =========================
            ROOM SYSTEM
        ========================= */}

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
        />

        {/* =========================
            DECEPTION AROUND US
        ========================= */}

        <Stack.Screen
          name="Night"
          component={NightScreen}
        />

        <Stack.Screen
          name="Day"
          component={DayScreen}
        />

        <Stack.Screen
          name="Voting"
          component={VotingScreen}
        />

        <Stack.Screen
          name="Observer"
          component={ObserverScreen}
        />

        <Stack.Screen
          name="GameOver"
          component={GameOverScreen}
        />

        {/* =========================
            ADMIN
        ========================= */}

        <Stack.Screen
          name="AdminCreateGame"
          component={AdminCreateGameScreen}
        />

      </Stack.Navigator>

    </NavigationContainer>
  );
}