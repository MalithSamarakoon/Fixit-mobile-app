import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Keyboard } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { auth, db } from '../../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { validateEmail, mapFirebaseAuthError } from './authValidation';

export default function LoginScreen({ navigation }) {
    const { setUserRole } = useContext(AuthContext);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleEmailChange = (text) => {
        setEmail(text);
        if (errors.email) {
            setErrors((prev) => ({ ...prev, email: '' }));
        }
    };

    const handlePasswordChange = (text) => {
        setPassword(text);
        if (errors.password) {
            setErrors((prev) => ({ ...prev, password: '' }));
        }
    };

    const handleLogin = async () => {
        Keyboard.dismiss();
        const emailValidation = validateEmail(email);
        const newErrors = {};

        if (!emailValidation.isValid) {
            newErrors.email = emailValidation.message;
        }

        if (!password) {
            newErrors.password = 'Please enter your password.';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, emailValidation.sanitized, password);
            const uid = userCredential.user.uid;

            const userDocRef = doc(db, 'users', uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                setUserRole(userData.role);
            } else {
                Alert.alert('Login Error', 'User data not found in database. Please contact support or register again.');
            }
        } catch (error) {
            const friendlyMessage = mapFirebaseAuthError(error);
            Alert.alert('Login Failed', friendlyMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>Login</Text>

                <Text style={styles.label}>Email</Text>
                <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    value={email}
                    onChangeText={handleEmailChange}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    placeholderTextColor="#A0A0A0"
                    editable={!loading}
                />
                {errors.email ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={14} color="#FFE4E4" />
                        <Text style={styles.errorText}>{errors.email}</Text>
                    </View>
                ) : null}

                <Text style={styles.label}>Password</Text>
                <View style={[styles.passwordContainer, errors.password && styles.inputError]}>
                    <TextInput
                        style={styles.passwordInput}
                        value={password}
                        onChangeText={handlePasswordChange}
                        secureTextEntry={!showPassword}
                        placeholderTextColor="#A0A0A0"
                        editable={!loading}
                    />
                    <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#888" />
                    </TouchableOpacity>
                </View>
                {errors.password ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={14} color="#FFE4E4" />
                        <Text style={styles.errorText}>{errors.password}</Text>
                    </View>
                ) : null}

                <TouchableOpacity
                    style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#5B84F2" />
                    ) : (
                        <Text style={styles.loginButtonText}>Login</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => navigation?.navigate('RoleSelection')}
                    disabled={loading}
                >
                    <Text style={styles.linkButtonText}>Don't have an account? Sign Up</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    card: { backgroundColor: '#5B84F2', padding: 30, borderRadius: 20, width: '80%' },
    title: { color: '#fff', fontSize: 24, fontWeight: '600', marginBottom: 25, textAlign: 'center' },
    label: { color: '#fff', fontSize: 14, marginBottom: 5, marginLeft: 10 },
    input: {
        backgroundColor: '#fff',
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginBottom: 15,
        fontSize: 14,
        color: '#1E2022',
    },
    inputError: {
        borderColor: '#FFB8B8',
        borderWidth: 2,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: -10,
        marginBottom: 12,
        marginLeft: 10,
        gap: 5,
    },
    errorText: {
        color: '#FFE4E4',
        fontSize: 12,
        fontWeight: '600',
        flexShrink: 1,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 25,
        paddingHorizontal: 15,
        marginBottom: 15,
        height: 45,
    },
    passwordInput: { flex: 1, fontSize: 14, height: '100%', color: '#1E2022' },
    loginButton: {
        backgroundColor: '#fff',
        borderRadius: 25,
        paddingVertical: 12,
        paddingHorizontal: 30,
        alignItems: 'center',
        marginTop: 15,
        alignSelf: 'center',
        minWidth: 140,
        height: 45,
        justifyContent: 'center',
    },
    loginButtonDisabled: {
        opacity: 0.85,
    },
    loginButtonText: { color: '#5B84F2', fontSize: 16, fontWeight: 'bold' },
    linkButton: { marginTop: 20, alignItems: 'center' },
    linkButtonText: { color: '#fff', fontSize: 13, textDecorationLine: 'underline' }
});


