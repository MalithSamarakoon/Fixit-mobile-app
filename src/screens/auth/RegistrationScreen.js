import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { auth, db } from '../../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons'; // Pre-installed with Expo

export default function RegistrationScreen({ route, navigation }) {
    const selectedRole = route.params?.selectedRole || 'HouseOwner';

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Conditional states
    const [location, setLocation] = useState('');
    const [serviceType, setServiceType] = useState('');
    const [experience, setExperience] = useState('');
    const [serviceCharges, setServiceCharges] = useState('');

    // Custom Validation Function
    const validateInputs = () => {
        // Regex rules
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\d{10}$/; // Exactly 10 digits
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

        if (!emailRegex.test(email)) {
            Alert.alert("Invalid Email", "Please enter a valid email address.");
            return false;
        }
        if (!phoneRegex.test(mobile)) {
            Alert.alert("Invalid Phone", "Phone number must be exactly 10 digits.");
            return false;
        }
        if (!passwordRegex.test(password)) {
            Alert.alert("Weak Password", "Password must be at least 8 characters long, include a capital letter, a simple letter, a number, and a special character.");
            return false;
        }
        if (password !== confirmPassword) {
            Alert.alert("Error", "Passwords do not match!");
            return false;
        }
        return true; // All good!
    };

    const handleRegister = async () => {
        if (!validateInputs()) return; // Stop if validations fail

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;

            let userData = {
                uid,
                role: selectedRole,
                username,
                email,
                mobile,
                createdAt: new Date(),
            };

            if (selectedRole === 'HouseOwner' || selectedRole === 'HardwareShop') {
                userData.location = location;
            } else if (selectedRole === 'TradeWorker') {
                userData.serviceType = serviceType;
                userData.experience = experience;
                userData.serviceCharges = serviceCharges;
            }

            await setDoc(doc(db, 'users', uid), userData);

            Alert.alert("Success", "Account created successfully!");
            navigation.navigate('Login');
        } catch (error) {
            Alert.alert("Registration Error", error.message);
        }
    };

    const renderConditionalFields = () => {
        switch (selectedRole) {
            case 'HouseOwner':
            case 'HardwareShop':
                return (
                    <>
                        <Text style={styles.label}>{selectedRole === 'HouseOwner' ? 'Default Location' : 'Shop Location'}</Text>
                        <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="e.g. Colombo 03" placeholderTextColor="#A0A0A0" />
                    </>
                );
            case 'TradeWorker':
                return (
                    <>
                        <Text style={styles.label}>Service Type</Text>
                        <TextInput style={styles.input} value={serviceType} onChangeText={setServiceType} placeholder="e.g. Plumber" placeholderTextColor="#A0A0A0" />

                        <Text style={styles.label}>Experience (Years)</Text>
                        <TextInput style={styles.input} value={experience} onChangeText={setExperience} keyboardType="numeric" placeholderTextColor="#A0A0A0" />

                        <Text style={styles.label}>Service Charges (LKR)</Text>
                        <TextInput style={styles.input} value={serviceCharges} onChangeText={setServiceCharges} keyboardType="numeric" placeholderTextColor="#A0A0A0" />
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>Sign Up</Text>
                <Text style={styles.subtitle}>as {selectedRole}</Text>

                <Text style={styles.label}>Username / Name</Text>
                <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholderTextColor="#A0A0A0" />

                <Text style={styles.label}>Email Address</Text>
                <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#A0A0A0" />

                <Text style={styles.label}>Mobile Number</Text>
                <TextInput style={styles.input} value={mobile} onChangeText={setMobile} keyboardType="phone-pad" placeholderTextColor="#A0A0A0" />

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

                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.passwordContainer}>
                    <TextInput
                        style={styles.passwordInput}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirmPassword}
                        placeholderTextColor="#A0A0A0"
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                        <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#888" />
                    </TouchableOpacity>
                </View>

                {renderConditionalFields()}

                <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
                    <Text style={styles.registerButtonText}>Register</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.linkButtonText}>Already have an account? Login</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
    card: { backgroundColor: '#5B84F2', padding: 30, borderRadius: 20, width: '85%' },
    title: { color: '#fff', fontSize: 24, fontWeight: '600', textAlign: 'center' },
    subtitle: { color: '#e0e0e0', fontSize: 14, marginBottom: 20, textAlign: 'center' },
    label: { color: '#fff', fontSize: 14, marginBottom: 5, marginLeft: 10 },
    input: { backgroundColor: '#fff', borderRadius: 25, paddingHorizontal: 15, paddingVertical: 10, marginBottom: 15, fontSize: 14 },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 25,
        paddingHorizontal: 15,
        marginBottom: 15,
        height: 45 // Fixed height helps container hold the icon nicely
    },
    passwordInput: { flex: 1, fontSize: 14, height: '100%' },
    registerButton: { backgroundColor: '#fff', borderRadius: 25, paddingVertical: 12, alignItems: 'center', marginTop: 15 },
    registerButtonText: { color: '#5B84F2', fontSize: 16, fontWeight: 'bold' },
    linkButton: { marginTop: 20, alignItems: 'center' },
    linkButtonText: { color: '#fff', fontSize: 13, textDecorationLine: 'underline' }
});


