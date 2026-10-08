import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';

const Tab = createBottomTabNavigator();

const DummyScreen = ({ route }) => (
    <View style={styles.container}>
        <Text>{route.name} Screen</Text>
    </View>
);

export default function ServiceAgencyNavigator() {
    return (
        <Tab.Navigator>
            <Tab.Screen name="Home" component={DummyScreen} />
            <Tab.Screen name="Bookings" component={DummyScreen} />
            <Tab.Screen name="Workers" component={DummyScreen} />
            <Tab.Screen name="Profile" component={DummyScreen} />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
