import React, { useState } from 'react';
import { View, TextInput, Button, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../FirebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const LoginForm = ({ onGoogleSignIn }: { onGoogleSignIn: () => void }) => {
    const [email, setEmail] = useState('roxane.rakotoarimanana@gmail.com'); // Default email
    const [password, setPassword] = useState('1234567'); // Default password
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

    const signIn = async () => {
        if (!validateInputs()) return;
        setLoading(true);
        try {
            const response = await signInWithEmailAndPassword(auth, email, password);
            const user = response.user;
            console.log("User Signed In:", user);

            // 🔥 Récupérer les infos de Firestore
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                console.log("User data from Firestore:", userDoc.data());
                Alert.alert('Succès', 'Connexion réussie !');
            } else {
                console.warn("Utilisateur non trouvé dans Firestore !");
                Alert.alert('Avertissement', 'Compte existant mais données utilisateur non trouvées.');
            }
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
                <ActivityIndicator size="large" color="#0000ff" />
            ) : (
                <>
                    <Button title="Se connecter" onPress={signIn} color="#007BFF" />
                </>
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

export default LoginForm;
