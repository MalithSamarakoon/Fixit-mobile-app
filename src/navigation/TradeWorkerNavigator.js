import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';

import HomeScreen from '../screens/tradeWorker/HomeScreen';
import JobRequestsScreen from '../screens/tradeWorker/JobRequestsScreen';
import JobDetailsScreen from '../screens/tradeWorker/JobDetailsScreen';
import CalendarScreen from '../screens/tradeWorker/CalendarScreen';
import EarningsScreen from '../screens/tradeWorker/EarningsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Temporary Placeholder component for Profile
const DummyScreen = ({ route }) => (
    <View style={styles.container}>
        <Text style={styles.dummyText}>{route.name} Screen coming soon...</Text>
    </View>
);

// Stack for the Home Tab
function HomeStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="HomeScreen" component={HomeScreen} />
            <Stack.Screen name="JobRequests" component={JobRequestsScreen} />
            <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
            <Stack.Screen name="Calendar" component={CalendarScreen} />
            <Stack.Screen name="Earnings" component={EarningsScreen} />
        </Stack.Navigator>
    );
}

// Stack for the Jobs Tab
function JobsStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="JobRequests" component={JobRequestsScreen} />
            <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
        </Stack.Navigator>
    );
}

export default function TradeWorkerNavigator() {
    return (
        <Tab.Navigator screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: { backgroundColor: '#fff', borderTopWidth: 0, elevation: 15, height: 60, paddingBottom: 10, paddingTop: 5 },
            tabBarIcon: ({ color, size }) => {
                let iconName;
                if (route.name === 'Dashboard') iconName = 'grid-outline';
                else if (route.name === 'Requests') iconName = 'clipboard-outline';
                else if (route.name === 'Schedule') iconName = 'calendar-outline';
                else if (route.name === 'Profile') iconName = 'person-outline';
                return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#5C8AF0',
            tabBarInactiveTintColor: '#A0A0A0',
        })}>
            <Tab.Screen name="Dashboard" component={HomeStack} />
            <Tab.Screen name="Requests" component={JobsStack} />
            <Tab.Screen name="Schedule" component={CalendarScreen} />
            <Tab.Screen name="Profile" component={DummyScreen} />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFBFF' },
    dummyText: { fontSize: 16, color: '#888' }
});


