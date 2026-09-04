import React from 'react';

import {
  NavigationContainer,
} from '@react-navigation/native';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import LoginScreen from '../screens/auth/LoginScreen';
import GameCatalogScreen from '../screens/games/GameCatalogScreen';

const Stack = createNativeStackNavigator();

function PlaceholderScreen({ route }) {
  return null;
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
        }}
      >

        {/* ==================== AUTH ==================== */}

        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />

        <Stack.Screen
          name="Register"
          component={PlaceholderScreen}
        />


        {/* ==================== MAIN ==================== */}

        <Stack.Screen
  name="GameCatalog"
  component={GameCatalogScreen}
/>

        <Stack.Screen
          name="CreateRoom"
          component={PlaceholderScreen}
        />

        <Stack.Screen
          name="JoinRoom"
          component={PlaceholderScreen}
        />

        <Stack.Screen
          name="Lobby"
          component={PlaceholderScreen}
        />


        {/* ==================== DECEPTION ==================== */}

        <Stack.Screen
          name="Night"
          component={PlaceholderScreen}
        />

        <Stack.Screen
          name="Day"
          component={PlaceholderScreen}
        />

        <Stack.Screen
          name="Voting"
          component={PlaceholderScreen}
        />

        <Stack.Screen
          name="Observer"
          component={PlaceholderScreen}
        />

        <Stack.Screen
          name="GameOver"
          component={PlaceholderScreen}
        />


        {/* ==================== ADMIN ==================== */}

        <Stack.Screen
          name="AdminCreateGame"
          component={PlaceholderScreen}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}