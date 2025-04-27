import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../FirebaseConfig';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

const DepositPopup = ({ visible, onClose }) => {
    const [amount, setAmount] = useState('');
    const [walletId, setWalletId] = useState('');
    const user = FIREBASE_AUTH.currentUser;

    useEffect(() => {
        // Fetch the user's walletId from Firestore when the component mounts
        const fetchUserInfo = async () => {
            const userDoc = await getDoc(doc(FIREBASE_DB, 'users', user.uid));
            if (userDoc.exists()) {
                setWalletId(userDoc.data().walletId);
            } else {
                console.error('User data not found');
            }
        };

        if (user) {
            fetchUserInfo();
        }
    }, [user]);

    const handleDeposit = async () => {
        if (!amount || isNaN(amount) || amount <= 0) {
            alert('Veuillez entrer un montant valide');
            return;
        }

        try {
            await addDoc(collection(FIREBASE_DB, 'transactions'), {
                walletId: walletId,
                amount: parseFloat(amount),
                date: new Date().toISOString(),
                type: 'dépot',
                status: 'en cours', // Can be "en_cours", "validé", or "échoué"
            });
            alert('Dépôt réussi !');
            setAmount('');
            onClose();
        } catch (error) {
            console.error('Erreur lors du dépôt :', error);
            alert('Une erreur est survenue');
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close" size={24} color="black" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Dépôt</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Montant"
                        keyboardType="numeric"
                        value={amount}
                        onChangeText={setAmount}
                    />
                    <TouchableOpacity style={styles.depositButton} onPress={handleDeposit}>
                        <Text style={styles.depositText}>DÉPOSER</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        width: 300,
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginBottom: 20,
        borderRadius: 5,
        textAlign: 'center',
    },
    depositButton: {
        backgroundColor: 'green',
        padding: 10,
        borderRadius: 5,
        width: '100%',
        alignItems: 'center',
    },
    depositText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

export default DepositPopup;
