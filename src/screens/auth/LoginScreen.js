import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { auth, db } from '../../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons'; // Icon package

export default function LoginScreen() {
    const { setUserRole } = useContext(AuthContext);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;

            const userDocRef = doc(db, 'users', uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                setUserRole(userData.role);
            } else {
                Alert.alert('Error', 'User data not found in database.');
            }
        } catch (error) {
            Alert.alert('Login Error', error.message);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>Login</Text>

                <Text style={styles.label}>Email</Text>
                <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholderTextColor="#A0A0A0"
                />

                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                    <TextInput
                        style={styles.passwordInput}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        placeholderTextColor="#A0A0A0"
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#888" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                    <Text style={styles.loginButtonText}>Login</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    card: { backgroundColor: '#5B84F2', padding: 30, borderRadius: 20, width: '80%' },
    title: { color: '#fff', fontSize: 24, fontWeight: '600', marginBottom: 30, textAlign: 'center' },
    label: { color: '#fff', fontSize: 14, marginBottom: 5, marginLeft: 10 },
    input: { backgroundColor: '#fff', borderRadius: 25, paddingHorizontal: 15, paddingVertical: 10, marginBottom: 20, fontSize: 14 },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 25,
        paddingHorizontal: 15,
        marginBottom: 20,
        height: 45
    },
    passwordInput: { flex: 1, fontSize: 14, height: '100%' },
    loginButton: { backgroundColor: '#fff', borderRadius: 25, paddingVertical: 12, paddingHorizontal: 30, alignItems: 'center', marginTop: 10, alignSelf: 'center' },
    loginButtonText: { color: '#5B84F2', fontSize: 16, fontWeight: 'bold' }
});


