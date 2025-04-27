import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View, Text, Image } from 'react-native';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { FIREBASE_AUTH } from '../../FirebaseConfig';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);

    const signInWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(FIREBASE_AUTH, provider);
            console.log("Google Sign-In:", result.user);
            alert('Connexion réussie avec Google !');
        } catch (error: any) {
            console.error('Error with Google sign-in:', error);
            alert('Erreur de connexion avec Google');
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <View style={styles.card}>
                {/* Image */}
                <Image source={require('../../assets/img/wallet.png')} style={styles.image} />

                <Text style={styles.title}>{isLogin ? 'Se connecter' : 'Créer un compte'}</Text>

                {isLogin ? (
                    <LoginForm />
                ) : (
                    <SignupForm />
                )}

                <Text style={styles.switchText} onPress={() => setIsLogin(!isLogin)}>
                    {isLogin ? "Vous n'avez pas de compte ?" : 'Connectez-vous'}
                </Text>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0F2F5',
        padding: 20,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 25,
        width: '90%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    image: {
        width: 100,  // Adjust the width as needed
        height: 100, // Adjust the height as needed
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
    },
    switchText: {
        marginTop: 20,
        color: '#007BFF',
        textDecorationLine: 'underline',
    },
});

export default Login;
