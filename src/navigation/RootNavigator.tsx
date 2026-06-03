import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import TodayScreen from '../screens/TodayScreen';
import HabitListScreen from '../screens/HabitListScreen';
import HabitDetailScreen from '../screens/HabitDetailScreen';
import AddHabitScreen from '../screens/AddHabitScreen';
import DebriefScreen from '../screens/DebriefScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Today">
        <Stack.Screen name="Today" component={TodayScreen} />
        <Stack.Screen name="HabitList" component={HabitListScreen} />
        <Stack.Screen name="HabitDetail" component={HabitDetailScreen} />
        <Stack.Screen name="AddHabit" component={AddHabitScreen} />
        <Stack.Screen name="Debrief" component={DebriefScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
