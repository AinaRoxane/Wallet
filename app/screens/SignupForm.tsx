import React, { useState } from 'react';
import { View, TextInput, Button, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../FirebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';

const SignupForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const auth = FIREBASE_AUTH;
    const db = FIREBASE_DB;

    const validateInputs = (): boolean => {
        if (!email.includes('@')) {
            Alert.alert('Erreur', 'Veuillez entrer un email valide.');
            return false;
        }
        if (password.length < 6) {
            Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères.');
            return false;
        }
        return true;
    };

    const signUp = async () => {
        if (!validateInputs()) return;
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log("User Created:", user);

            // Fetch all cryptocurrencies from the 'cours' collection
            const cryptosRef = collection(db, "cours");
            const querySnapshot = await getDocs(cryptosRef);
            const balance: { [key: string]: number } = {};

            // Loop through the docs to extract the symbols and set the balance to 0.0
            querySnapshot.forEach((doc) => {
                const crypto = doc.data();
                const symbol = crypto.symbol;
                balance[symbol] = 0.0; // Initialize the balance for each crypto symbol to 0.0
            });

            // Initialize user data in Firestore
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                fullName: "", // Default empty full name
                profilePic: "", // Default empty profile picture URL
                walletId: "wallet_" + user.uid, // Generate wallet ID
                favoriteCryptos: [],
                balance: balance, // Set the dynamic balance object
                notificationsEnabled: true, // Enable notifications by default
                createdAt: new Date().toISOString(), // Add creation timestamp
            });

            Alert.alert("Succès", "Compte créé ! Vérifiez vos emails.");
        } catch (error: any) {
            handleAuthError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAuthError = (error: any) => {
        console.error("Firebase Auth Error:", error.code, error.message);
        Alert.alert("Erreur", `Code: ${error.code}\nMessage: ${error.message}`);
    };

    return (
        <View>
            <TextInput
                value={email}
                style={styles.input}
                placeholder="E-MAIL"
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={setEmail}
            />

            <TextInput
                value={password}
                style={styles.input}
                placeholder="MOT DE PASSE"
                autoCapitalize="none"
                secureTextEntry={true}
                onChangeText={setPassword}
            />

            {loading ? (
                <ActivityIndicator size="large" color="grey" />
            ) : (
                <Button title="ENREGISTRER" onPress={signUp} color="#a8dcff" />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    input: {
        width: 200,
        marginVertical: 10,
        height: 50,
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 10,
        paddingHorizontal: 15,
        backgroundColor: '#FAFAFA',
    },
});

export default SignupForm;