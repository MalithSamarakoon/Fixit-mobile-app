import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';

import HomeScreen from '../screens/houseOwner/HomeScreen';
import WorkerProfileScreen from '../screens/houseOwner/WorkerProfileScreen';
import TaskDescriptionScreen from '../screens/houseOwner/TaskDescriptionScreen';
import EstimatedCostScreen from '../screens/houseOwner/EstimatedCostScreen';
import WorkerTrackingScreen from '../screens/houseOwner/WorkerTrackingScreen';
import FeedbackScreen from '../screens/houseOwner/FeedbackScreen';


const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// 1. We create a Mini-Stack just for the Home Tab
function HomeStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="HomeScreen" component={HomeScreen} />
            <Stack.Screen name="WorkerProfile" component={WorkerProfileScreen} />
            <Stack.Screen name="TaskDescription" component={TaskDescriptionScreen} />

            <Stack.Screen name="EstimatedCost" component={EstimatedCostScreen} />
            <Stack.Screen name="WorkerTracking" component={WorkerTrackingScreen} />
            <Stack.Screen name="Feedback" component={FeedbackScreen} />
        </Stack.Navigator>
    );
}

const DummyScreen = ({ route }) => (
    <View style={styles.container}>
        <Text>{route.name} Screen</Text>
    </View>
);

export default function HouseOwnerNavigator() {
    return (
        <Tab.Navigator screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: { backgroundColor: '#fff', borderTopWidth: 0, elevation: 10 },
            tabBarIcon: ({ color, size }) => {
                let iconName;
                if (route.name === 'Home') iconName = 'home';
                else if (route.name === 'Bookings') iconName = 'calendar';
                else if (route.name === 'Workers') iconName = 'people';
                else if (route.name === 'Profile') iconName = 'person';
                return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#3B66FE',
            tabBarInactiveTintColor: '#A0A0A0',
        })}>
            {/* 2. We use the HomeStack here instead of a simple screen */}
            <Tab.Screen name="Home" component={HomeStack} />
            <Tab.Screen name="Bookings" component={DummyScreen} />
            <Tab.Screen name="Workers" component={DummyScreen} />
            <Tab.Screen name="Profile" component={DummyScreen} />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

