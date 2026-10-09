import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';

// Import all the Service Agency screens
import HomeScreen from '../screens/serviceAgency/HomeScreen';
import WorkersScreen from '../screens/serviceAgency/WorkersScreen';
import AddWorkerScreen from '../screens/serviceAgency/AddWorkerScreen';
import NewJobAssignmentScreen from '../screens/serviceAgency/NewJobAssignmentScreen';
import BookingsScreen from '../screens/serviceAgency/BookingsScreen'; // NEW

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Fallback for Profile Screen
const DummyScreen = ({ route }) => (
    <View style={styles.container}>
        <Text style={styles.dummyText}>{route.name} Screen coming soon...</Text>
    </View>
);

// Stack for the Home Tab
function HomeStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="AgencyHome" component={HomeScreen} />
            <Stack.Screen name="NewJobAssignment" component={NewJobAssignmentScreen} />
        </Stack.Navigator>
    );
}

// Stack for the Workers Tab
function WorkersStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="WorkersList" component={WorkersScreen} />
            <Stack.Screen name="AddWorker" component={AddWorkerScreen} />
        </Stack.Navigator>
    );
}

export default function ServiceAgencyNavigator() {
    return (
        <Tab.Navigator screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: { backgroundColor: '#fff', borderTopWidth: 0, elevation: 15, height: 60, paddingBottom: 10, paddingTop: 5 },
            tabBarIcon: ({ color, size, focused }) => {
                let iconName;
                if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
                else if (route.name === 'Bookings') iconName = focused ? 'calendar' : 'calendar-outline';
                else if (route.name === 'Workers') iconName = focused ? 'people' : 'people-outline';
                else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';

                return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#5C8AF0',
            tabBarInactiveTintColor: '#A0A0A0',
        })}>
            <Tab.Screen name="Home" component={HomeStack} />
            <Tab.Screen name="Bookings" component={BookingsScreen} />
            <Tab.Screen name="Workers" component={WorkersStack} />
            <Tab.Screen name="Profile" component={DummyScreen} />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FE' },
    dummyText: { fontSize: 16, color: '#888' }
});

