import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

export default function SplashScreen({ navigation }) {
    return (
        <View style={styles.container}>

            <Image
                source={require('../../../assets/fixit-logo.png')} // Points to the assets folder
                style={styles.logo}
                resizeMode="contain"
            />

            <Text style={styles.welcomeText}>Welcome to Fix-It !</Text>

            <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate('RoleSelection')}
            >
                <Text style={styles.buttonText}>Next →</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoPlaceholder: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
    },
    logoText: {
        color: '#888',
        fontWeight: 'bold',
    },
    welcomeText: {
        fontSize: 22,
        fontWeight: '600',
        marginBottom: 50,
        color: '#333',
    },
    button: {
        backgroundColor: '#5B84F2',
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 25,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
