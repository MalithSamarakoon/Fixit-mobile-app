import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';

import HomeScreen from '../screens/hardwareShop/HomeScreen';
import ProductsScreen from '../screens/hardwareShop/ProductsScreen';
import AddProductScreen from '../screens/hardwareShop/AddProductScreen';
import EditProductScreen from '../screens/hardwareShop/EditProductScreen';
import OrdersScreen from '../screens/hardwareShop/OrdersScreen';
import OrderDetailsScreen from '../screens/hardwareShop/OrderDetailsScreen';
import AdsPromosScreen from '../screens/hardwareShop/AdsPromosScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const DummyScreen = ({ route }) => (
    <View style={styles.container}>
        <Text style={styles.dummyText}>{route.name} Screen coming soon...</Text>
    </View>
);

function ProductsStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="HomeScreen" component={HomeScreen} />
            <Stack.Screen name="ProductsList" component={ProductsScreen} />
            <Stack.Screen name="AddProduct" component={AddProductScreen} />
            <Stack.Screen name="EditProduct" component={EditProductScreen} />
        </Stack.Navigator>
    );
}

function OrdersStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="OrdersList" component={OrdersScreen} />
            <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
        </Stack.Navigator>
    );
}

export default function HardwareShopNavigator() {
    return (
        <Tab.Navigator screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: { backgroundColor: '#fff', borderTopWidth: 0, elevation: 15, height: 60, paddingBottom: 10, paddingTop: 5 },
            tabBarIcon: ({ color, size, focused }) => {
                let iconName;
                if (route.name === 'Products') iconName = focused ? 'cube' : 'cube-outline';
                else if (route.name === 'Orders') iconName = focused ? 'file-tray-full' : 'file-tray-full-outline';
                else if (route.name === 'Ads') iconName = focused ? 'megaphone' : 'megaphone-outline';
                else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
                return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#5C8AF0',
            tabBarInactiveTintColor: '#A0A0A0',
        })}>
            <Tab.Screen name="Products" component={ProductsStack} />
            <Tab.Screen name="Orders" component={OrdersStack} />
            <Tab.Screen name="Ads" component={AdsPromosScreen} />
            <Tab.Screen name="Profile" component={DummyScreen} />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FE' },
    dummyText: { fontSize: 16, color: '#888' }
});
