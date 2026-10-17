import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Keyboard } from 'react-native';
import { auth, db } from '../../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import {
    sanitizePhoneNumber,
    validatePhoneNumber,
    validateEmail,
    validateRegistrationPassword,
    validatePasswordConfirmation,
    mapFirebaseAuthError,
} from './authValidation';

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
    const ROLES = ['Plumber', 'Electrician', 'Cleaner', 'Painter', 'Other'];
    const [serviceType, setServiceType] = useState('Plumber');
    const [otherServiceType, setOtherServiceType] = useState('');
    const [showRoleDropdown, setShowRoleDropdown] = useState(false);
    const [experience, setExperience] = useState('');
    const [serviceCharges, setServiceCharges] = useState('');

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Handlers with real-time feedback
    const handleUsernameChange = (text) => {
        setUsername(text);
        if (errors.username) {
            setErrors((prev) => ({ ...prev, username: '' }));
        }
    };

    const handleEmailChange = (text) => {
        setEmail(text);
        if (errors.email) {
            setErrors((prev) => ({ ...prev, email: '' }));
        }
    };

    const handleEmailBlur = () => {
        if (email.trim().length > 0) {
            const validation = validateEmail(email);
            if (!validation.isValid) {
                setErrors((prev) => ({ ...prev, email: validation.message }));
            }
        }
    };

    const handleMobileChange = (text) => {
        // Enforce numeric only and cap at 10 digits
        const sanitized = sanitizePhoneNumber(text);
        setMobile(sanitized);

        if (errors.mobile) {
            if (sanitized.length === 10) {
                setErrors((prev) => ({ ...prev, mobile: '' }));
            } else {
                setErrors((prev) => ({ ...prev, mobile: 'Phone number must contain exactly 10 digits.' }));
            }
        }
    };

    const handleMobileBlur = () => {
        if (mobile.length > 0 && mobile.length !== 10) {
            setErrors((prev) => ({ ...prev, mobile: 'Phone number must contain exactly 10 digits.' }));
        }
    };

    const handlePasswordChange = (text) => {
        setPassword(text);
        if (errors.password) {
            setErrors((prev) => ({ ...prev, password: '' }));
        }
        if (confirmPassword && errors.confirmPassword && text === confirmPassword) {
            setErrors((prev) => ({ ...prev, confirmPassword: '' }));
        }
    };

    const handleConfirmPasswordChange = (text) => {
        setConfirmPassword(text);
        if (errors.confirmPassword && text === password) {
            setErrors((prev) => ({ ...prev, confirmPassword: '' }));
        }
    };

    // Form Validation Function
    const validateInputs = () => {
        const newErrors = {};

        // Username
        if (!username.trim()) {
            newErrors.username = 'Please enter your name.';
        }

        // Email
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
            newErrors.email = emailValidation.message;
        }

        // Mobile: exactly 10 digits, numeric only, stored as string
        const phoneValidation = validatePhoneNumber(mobile);
        if (!phoneValidation.isValid) {
            newErrors.mobile = phoneValidation.message;
        }

        // Password
        const passwordValidation = validateRegistrationPassword(password);
        if (!passwordValidation.isValid) {
            newErrors.password = passwordValidation.message;
        }

        // Confirm Password
        const confirmValidation = validatePasswordConfirmation(password, confirmPassword);
        if (!confirmValidation.isValid) {
            newErrors.confirmPassword = confirmValidation.message;
        }

        // Conditional role validations
        if (selectedRole === 'HouseOwner') {
            if (!location.trim()) {
                newErrors.location = 'Please provide your default location / city.';
            }
        } else if (selectedRole === 'HardwareShop') {
            if (!location.trim()) {
                newErrors.location = 'Please provide your shop location / city.';
            }
        } else if (selectedRole === 'TradeWorker') {
            if (!location.trim()) {
                newErrors.location = 'Please provide your working location / city.';
            }
            if (serviceType === 'Other' && !otherServiceType.trim()) {
                newErrors.otherServiceType = 'Please specify your trade type.';
            }
            if (experience && (isNaN(experience) || Number(experience) < 0)) {
                newErrors.experience = 'Experience must be a valid number of years.';
            }
            if (serviceCharges && (isNaN(serviceCharges) || Number(serviceCharges) < 0)) {
                newErrors.serviceCharges = 'Service charges must be a valid numeric amount.';
            }
        }

        setErrors(newErrors);
        return {
            isValid: Object.keys(newErrors).length === 0,
            sanitizedEmail: emailValidation.sanitized,
            sanitizedMobile: sanitizePhoneNumber(mobile),
        };
    };

    const handleRegister = async () => {
        Keyboard.dismiss();
        const { isValid, sanitizedEmail, sanitizedMobile } = validateInputs();

        if (!isValid) {
            Alert.alert("Validation Error", "Please correct the highlighted errors before submitting.");
            return;
        }

        setLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, sanitizedEmail, password);
            const uid = userCredential.user.uid;

            const finalRole = serviceType === 'Other' ? otherServiceType.trim() : serviceType;

            const userData = {
                uid,
                role: selectedRole,
                username: username.trim(),
                name: username.trim(),
                email: sanitizedEmail,
                mobile: sanitizedMobile,
                phone: sanitizedMobile,
                createdAt: new Date(),
            };

            if (selectedRole === 'HouseOwner' || selectedRole === 'HardwareShop') {
                userData.location = location.trim();
            } else if (selectedRole === 'TradeWorker') {
                userData.location = location.trim();
                userData.serviceType = finalRole;
                userData.trade = finalRole;
                userData.experience = experience.trim();
                userData.serviceCharges = serviceCharges.trim();
                userData.status = 'Available';
                userData.rating = 5.0;
            } else if (selectedRole === 'ServiceAgency') {
                if (location.trim()) {
                    userData.location = location.trim();
                    userData.address = location.trim();
                }
            }

            await setDoc(doc(db, 'users', uid), userData);

            Alert.alert("Success", "Account created successfully! Please log in.", [
                { text: "OK", onPress: () => navigation.navigate('Login') }
            ]);
        } catch (error) {
            const friendlyMessage = mapFirebaseAuthError(error);
            Alert.alert("Registration Failed", friendlyMessage);
        } finally {
            setLoading(false);
        }
    };

    const renderConditionalFields = () => {
        switch (selectedRole) {
            case 'HouseOwner':
            case 'HardwareShop':
                return (
                    <>
                        <Text style={styles.label}>{selectedRole === 'HouseOwner' ? 'Default Location' : 'Shop Location'}</Text>
                        <TextInput
                            style={[styles.input, errors.location && styles.inputError]}
                            value={location}
                            onChangeText={(val) => {
                                setLocation(val);
                                if (errors.location) setErrors((prev) => ({ ...prev, location: '' }));
                            }}
                            placeholder="e.g. Colombo 03"
                            placeholderTextColor="#A0A0A0"
                            editable={!loading}
                        />
                        {errors.location ? (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={14} color="#FFE4E4" />
                                <Text style={styles.errorText}>{errors.location}</Text>
                            </View>
                        ) : null}
                    </>
                );
            case 'TradeWorker':
                return (
                    <>
                        {/* Location field */}
                        <Text style={styles.label}>Working Location / City</Text>
                        <TextInput 
                            style={[styles.input, errors.location && styles.inputError]} 
                            value={location} 
                            onChangeText={(val) => {
                                setLocation(val);
                                if (errors.location) setErrors((prev) => ({ ...prev, location: '' }));
                            }}
                            placeholder="e.g. Colombo 07, Dehiwala" 
                            placeholderTextColor="#A0A0A0" 
                            editable={!loading}
                        />
                        {errors.location ? (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={14} color="#FFE4E4" />
                                <Text style={styles.errorText}>{errors.location}</Text>
                            </View>
                        ) : null}

                        {/* Role Dropdown */}
                        <Text style={styles.label}>Role / Trade Type</Text>
                        <TouchableOpacity 
                            style={styles.dropdownSelector} 
                            onPress={() => setShowRoleDropdown(!showRoleDropdown)}
                            activeOpacity={0.8}
                            disabled={loading}
                        >
                            <Text style={styles.dropdownSelectorText}>{serviceType}</Text>
                            <Ionicons name={showRoleDropdown ? "chevron-up" : "chevron-down"} size={20} color="#5B84F2" />
                        </TouchableOpacity>

                        {showRoleDropdown && (
                            <View style={styles.dropdownMenu}>
                                {ROLES.map((roleItem) => (
                                    <TouchableOpacity
                                        key={roleItem}
                                        style={[
                                            styles.dropdownItem,
                                            serviceType === roleItem && styles.dropdownItemSelected
                                        ]}
                                        onPress={() => {
                                            setServiceType(roleItem);
                                            setShowRoleDropdown(false);
                                        }}
                                    >
                                        <Text style={[
                                            styles.dropdownItemText,
                                            serviceType === roleItem && styles.dropdownItemTextSelected
                                        ]}>
                                            {roleItem}
                                        </Text>
                                        {serviceType === roleItem && (
                                            <Ionicons name="checkmark" size={18} color="#5B84F2" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* Conditional input: Only visible when 'Other' is chosen */}
                        {serviceType === 'Other' && (
                            <>
                                <Text style={styles.label}>Specify Your Trade</Text>
                                <TextInput 
                                    style={[styles.input, errors.otherServiceType && styles.inputError]} 
                                    value={otherServiceType} 
                                    onChangeText={(val) => {
                                        setOtherServiceType(val);
                                        if (errors.otherServiceType) setErrors((prev) => ({ ...prev, otherServiceType: '' }));
                                    }} 
                                    placeholder="e.g. Carpenter, Welder, AC Repair" 
                                    placeholderTextColor="#A0A0A0" 
                                    editable={!loading}
                                />
                                {errors.otherServiceType ? (
                                    <View style={styles.errorContainer}>
                                        <Ionicons name="alert-circle" size={14} color="#FFE4E4" />
                                        <Text style={styles.errorText}>{errors.otherServiceType}</Text>
                                    </View>
                                ) : null}
                            </>
                        )}

                        <Text style={styles.label}>Experience (Years)</Text>
                        <TextInput
                            style={[styles.input, errors.experience && styles.inputError]}
                            value={experience}
                            onChangeText={(val) => {
                                setExperience(val.replace(/\D/g, ''));
                                if (errors.experience) setErrors((prev) => ({ ...prev, experience: '' }));
                            }}
                            keyboardType="numeric"
                            placeholder="e.g. 5"
                            placeholderTextColor="#A0A0A0"
                            editable={!loading}
                        />
                        {errors.experience ? (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={14} color="#FFE4E4" />
                                <Text style={styles.errorText}>{errors.experience}</Text>
                            </View>
                        ) : null}

                        <Text style={styles.label}>Service Charges (LKR/hr)</Text>
                        <TextInput
                            style={[styles.input, errors.serviceCharges && styles.inputError]}
                            value={serviceCharges}
                            onChangeText={(val) => {
                                setServiceCharges(val.replace(/\D/g, ''));
                                if (errors.serviceCharges) setErrors((prev) => ({ ...prev, serviceCharges: '' }));
                            }}
                            keyboardType="numeric"
                            placeholder="e.g. 1500"
                            placeholderTextColor="#A0A0A0"
                            editable={!loading}
                        />
                        {errors.serviceCharges ? (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={14} color="#FFE4E4" />
                                <Text style={styles.errorText}>{errors.serviceCharges}</Text>
                            </View>
                        ) : null}
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
                <TextInput
                    style={[styles.input, errors.username && styles.inputError]}
                    value={username}
                    onChangeText={handleUsernameChange}
                    placeholderTextColor="#A0A0A0"
                    editable={!loading}
                />
                {errors.username ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={14} color="#FFE4E4" />
                        <Text style={styles.errorText}>{errors.username}</Text>
                    </View>
                ) : null}

                <Text style={styles.label}>Email Address</Text>
                <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    value={email}
                    onChangeText={handleEmailChange}
                    onBlur={handleEmailBlur}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="e.g. user@example.com"
                    placeholderTextColor="#A0A0A0"
                    editable={!loading}
                />
                {errors.email ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={14} color="#FFE4E4" />
                        <Text style={styles.errorText}>{errors.email}</Text>
                    </View>
                ) : null}

                <Text style={styles.label}>Mobile Number</Text>
                <TextInput
                    style={[styles.input, errors.mobile && styles.inputError]}
                    value={mobile}
                    onChangeText={handleMobileChange}
                    onBlur={handleMobileBlur}
                    keyboardType="phone-pad"
                    maxLength={10}
                    placeholder="10 digit phone number"
                    placeholderTextColor="#A0A0A0"
                    editable={!loading}
                />
                {errors.mobile ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={14} color="#FFE4E4" />
                        <Text style={styles.errorText}>{errors.mobile}</Text>
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
                <Text style={styles.helperText}>
                    Must be at least 8 characters with uppercase, lowercase, number, and special character.
                </Text>
                {errors.password ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={14} color="#FFE4E4" />
                        <Text style={styles.errorText}>{errors.password}</Text>
                    </View>
                ) : null}

                <Text style={styles.label}>Confirm Password</Text>
                <View style={[styles.passwordContainer, errors.confirmPassword && styles.inputError]}>
                    <TextInput
                        style={styles.passwordInput}
                        value={confirmPassword}
                        onChangeText={handleConfirmPasswordChange}
                        secureTextEntry={!showConfirmPassword}
                        placeholderTextColor="#A0A0A0"
                        editable={!loading}
                    />
                    <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#888" />
                    </TouchableOpacity>
                </View>
                {errors.confirmPassword ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={14} color="#FFE4E4" />
                        <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                    </View>
                ) : null}

                {renderConditionalFields()}

                <TouchableOpacity
                    style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                    onPress={handleRegister}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#5B84F2" />
                    ) : (
                        <Text style={styles.registerButtonText}>Register</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => navigation.navigate('Login')}
                    disabled={loading}
                >
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
    helperText: {
        color: '#E2E8F0',
        fontSize: 11,
        marginTop: -10,
        marginBottom: 10,
        marginLeft: 10,
        lineHeight: 14,
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
    dropdownSelector: {
        backgroundColor: '#fff',
        borderRadius: 25,
        paddingHorizontal: 18,
        height: 45,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    dropdownSelectorText: { fontSize: 14, color: '#1E2022', fontWeight: '500' },
    dropdownMenu: {
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingVertical: 6,
        marginBottom: 15,
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 6,
    },
    dropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 18,
    },
    dropdownItemSelected: { backgroundColor: '#EDF2FE' },
    dropdownItemText: { fontSize: 14, color: '#4B5563' },
    dropdownItemTextSelected: { color: '#5B84F2', fontWeight: 'bold' },
    registerButton: {
        backgroundColor: '#fff',
        borderRadius: 25,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 15,
        height: 45,
        justifyContent: 'center',
    },
    registerButtonDisabled: {
        opacity: 0.85,
    },
    registerButtonText: { color: '#5B84F2', fontSize: 16, fontWeight: 'bold' },
    linkButton: { marginTop: 20, alignItems: 'center' },
    linkButtonText: { color: '#fff', fontSize: 13, textDecorationLine: 'underline' }
});


