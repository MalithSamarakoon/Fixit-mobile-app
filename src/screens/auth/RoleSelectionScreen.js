import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function RoleSelectionScreen({ navigation }) {
    const handleRoleSelect = (role) => {
        // Pass the selected role to the Registration screen for testing purposes
        navigation.navigate('Registration', { selectedRole: role });
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>Are you a? ...</Text>

                <TouchableOpacity style={styles.roleButton} onPress={() => handleRoleSelect('HouseOwner')}>
                    <Text style={styles.roleButtonText}>House Owner</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.roleButton} onPress={() => handleRoleSelect('TradeWorker')}>
                    <Text style={styles.roleButtonText}>Trade Worker</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.roleButton} onPress={() => handleRoleSelect('ServiceAgency')}>
                    <Text style={styles.roleButtonText}>Service providing agency</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.roleButton} onPress={() => handleRoleSelect('HardwareShop')}>
                    <Text style={styles.roleButtonText}>Hardware shop owner</Text>
                </TouchableOpacity>
            </View>
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
    card: {
        backgroundColor: '#5B84F2',
        padding: 30,
        borderRadius: 20,
        width: '80%',
        alignItems: 'center',
    },
    title: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 30,
    },
    roleButton: {
        backgroundColor: '#fff',
        width: '100%',
        paddingVertical: 12,
        borderRadius: 25,
        marginBottom: 15,
        alignItems: 'center',
    },
    roleButtonText: {
        color: '#333',
        fontSize: 14,
        fontWeight: '500',
    },
});
