import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';

const Tab = createBottomTabNavigator();

const DummyScreen = ({ route }) => (
    <View style={styles.container}>
        <Text>{route.name} Screen</Text>
    </View>
);

export default function TradeWorkerNavigator() {
    return (
        <Tab.Navigator>
            <Tab.Screen name="Dashboard" component={DummyScreen} />
            <Tab.Screen name="Requests" component={DummyScreen} />
            <Tab.Screen name="Schedule" component={DummyScreen} />
            <Tab.Screen name="Profile" component={DummyScreen} />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
