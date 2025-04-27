import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../FirebaseConfig';
import { updateProfile } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import DepositPopup from '../popups/DepositPopup';
import WithdrawalPopup from '../popups/RetraitPopup';
import { NavigationProp } from '@react-navigation/native';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

interface RouterProps {
  navigation: NavigationProp<any, any>;
}

const Profile = ({ navigation }: RouterProps) => {
  const user = FIREBASE_AUTH.currentUser;
  const [name, setName] = useState(user?.displayName || 'UNKNOWN');
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newName, setNewName] = useState(name);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [balance, setBalance] = useState<number | null>(null);
  const [cryptoData, setCryptoData] = useState<any[]>([]);  // To store cryptocurrency information
  const [modalVisible, setModalVisible] = useState(false);
  const [withdrawalModalVisible, setWithdrawalModalVisible] = useState(false);
  const [profilePic, setProfilePic] = useState<string>('');

  useEffect(() => {
    const fetchBalance = async () => {
      if (!user) return;

      try {
        const userRef = doc(FIREBASE_DB, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          const userBalance = userData.balance || {};
          let totalBalance = 0;

          // Fetch each cryptocurrency's data
          const cryptoList: any[] = [];

          for (const crypto in userBalance) {
            const cryptoQuery = query(collection(FIREBASE_DB, 'cours'), where('symbol', '==', crypto));
            const cryptoSnap = await getDocs(cryptoQuery);

            if (!cryptoSnap.empty) {
              const cryptoData = cryptoSnap.docs[0].data(); // Get the first matching document
              const priceHistory = cryptoData.priceHistory || {};
              // Step 1: Sort the keys (timestamps) in ascending order and get the last one
              const sortedKeys = Object.keys(priceHistory).sort((a, b) => new Date(a) - new Date(b));

              // Step 2: Get the last key and value
              const latestKey = sortedKeys[sortedKeys.length - 1];  // Latest timestamp
              const latestPrice = priceHistory[latestKey] || 0;

              // Add cryptocurrency to the list
              cryptoList.push({
                symbol: crypto,
                name: cryptoData.name,
                logo: cryptoData.logo,
                quantity: userBalance[crypto],
                latestPrice,
              });

              totalBalance += userBalance[crypto] * latestPrice;
            }
          }
          setBalance(totalBalance);
          setCryptoData(cryptoList); // Save cryptocurrency data to state
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du solde :', error);
      }
    };

    fetchBalance();
  }, [user]);

  useEffect(() => {
    const fetchUnreadNotifications = async () => {
      if (!user) return;
  
      try {
        // Query to get unread notifications for the current user
        const notificationsQuery = query(
          collection(FIREBASE_DB, 'notifications'),
          where('email', '==', user.email),
          where('wasOpened', '==', false)
        );
  
        // Fetch notifications
        const notificationsSnap = await getDocs(notificationsQuery);
  
        // Set the number of unread notifications
        setUnreadNotifications(notificationsSnap.size);
      } catch (error) {
        console.error('Error fetching unread notifications:', error);
      }
    };
  
    fetchUnreadNotifications();
  }, [user]);


  useEffect(() => {
    const fetchProfilePic = async () => {
      if (!user) return;

      try {
        const userQuery = query(collection(FIREBASE_DB, 'users'), where('email', '==', user.email));
        const userSnap = await getDocs(userQuery);

        if (!userSnap.empty) {
          const userData = userSnap.docs[0].data();
          setProfilePic(userData.profilePic || ''); // Get profilePic URL from Firestore
        }
      } catch (error) {
        console.error('Error fetching profile picture:', error);
      }
    };

    fetchProfilePic();
  }, [user]);

  const saveChanges = async () => {
    if (user) {
      setLoading(true);
      try {
        await updateProfile(user, { displayName: newName });

        const userRef = doc(FIREBASE_DB, 'users', user.uid);
        await updateDoc(userRef, { fullName: newName });

        setName(newName);
        setEditModalVisible(false);
      } catch (error) {
        console.error("Erreur lors de la mise à jour du profil :", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const signOut = () => {
    FIREBASE_AUTH.signOut();
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
      <View style={styles.container}>
        {/* Always visible top section */}
        <View style={styles.topSection}>
          {/* Modifier le nom */}
          <TouchableOpacity onPress={() => setEditModalVisible(true)} style={styles.editButton}>
            <Ionicons name="pencil" size={20} color="black" />
          </TouchableOpacity>

          {/* Notifications */}
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="black" />
            {unreadNotifications > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>{unreadNotifications}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Scrollable content */}
        <ScrollView contentContainerStyle={styles.scrollViewContainer}>
          {/* Carte de profil */}
          <View style={styles.card}>
            <View style={styles.profileImageContainer}>
              <Image
                source={profilePic ? { uri: profilePic } : require('../../assets/img/user.png')}
                style={styles.profileImage}
              />
            </View>
            <View style={styles.profileInfoContainer}>
              <Text style={styles.name}>{name}</Text>
              <Text style={styles.email}>{user?.email}</Text>
              <Text style={styles.balanceText}>
                {balance !== null ? balance.toFixed(2) + ' $' : 'Estimation du solde...'}
              </Text>
            </View>
          </View>

          {/* Boutons Dépôt / Retrait */}
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.button, styles.retrait]} onPress={() => setWithdrawalModalVisible(true)}>
              <Ionicons name="arrow-up-outline" size={20} color="white" />
              <Text style={styles.buttonText}>Retrait</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.depot]} onPress={() => setModalVisible(true)}>
              <Ionicons name="arrow-down-outline" size={20} color="white" />
              <Text style={styles.buttonText}>Dépot</Text>
            </TouchableOpacity>
          </View>

          {/* Display crypto holdings */}
          {cryptoData.length > 0 ? (
            <View style={styles.cryptoHoldings}>
              <Text style={styles.cryptoTitle}>Cryptomonnaies:</Text>
              {cryptoData.map((crypto, index) => (
                <View key={index} style={styles.cryptoCard}>
                  <View style={styles.cryptoHeader}>
                    <Image source={{ uri: crypto.logo }} style={styles.cryptoLogo} />
                    <Text style={styles.cryptoName}>{crypto.name} ({crypto.symbol})</Text>
                  </View>
                  <Text style={styles.cryptoAmount}>Total en possession: {crypto.quantity}</Text>
                  <Text style={styles.cryptoPrice}>
                    Prix : {crypto.latestPrice} $ - Total : {(crypto.quantity * crypto.latestPrice).toFixed(2)} $
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.cryptoTitle}>Aucune cryptomonnaie détenue.</Text>
          )}
        </ScrollView>

        {/* Fixed Navbar */}
        <View style={styles.navbar}>
          <TouchableOpacity onPress={() => navigation.navigate('Cours en Temps Réel')} style={styles.navItem}>
            <Ionicons name="speedometer-outline" size={24} color="white" />
            <Text style={styles.navText}>Cours</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Historiques')} style={styles.navItem}>
            <Ionicons name="receipt-outline" size={24} color="white" />
            <Text style={styles.navText}>Historique</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={signOut} style={styles.navItem}>
            <Ionicons name="exit-outline" size={24} color="white" />
            <Text style={styles.navText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>

        {/* Modal pour modifier le nom */}
        <Modal visible={editModalVisible} transparent={true} animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text>Nouveau nom :</Text>
              <TextInput style={styles.input} value={newName} onChangeText={setNewName} />
              {/* Icon for Camera (Appareil Photo) */}
              <Text>Prendre une nouvelle photo de profil:</Text>
              <TouchableOpacity onPress={() => {navigation.navigate('Photo'); setEditModalVisible(false);}} style={styles.cameraButton}>
                <Ionicons name="camera-outline" size={60} color="black" />
              </TouchableOpacity>

              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setEditModalVisible(false)}>
                  <Text style={styles.modalButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalButton} onPress={saveChanges}>
                  <Text style={styles.modalButtonText}>Sauvegarder</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Popups */}
        <DepositPopup visible={modalVisible} onClose={() => setModalVisible(false)} />
        <WithdrawalPopup balance={balance} visible={withdrawalModalVisible} onClose={() => setWithdrawalModalVisible(false)} />
      </View>

  );
};

const styles = StyleSheet.create({
  cameraButton: {
    alignSelf: 'center',
    marginTop: 10,  // Adjust the spacing as needed
    padding: 10,
  },
  cryptoHoldings: {
      width: '90%',
      marginLeft: '4%',
      marginBottom: '26%',
  },
  container: {
    flex: 1,
  },
  topSection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 20,
    paddingLeft: 10,
    paddingRight: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  editButton: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 10,
    borderRadius: 50,
  },
  notificationButton: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'red',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    color: 'white',
    fontSize: 12,
  },
  scrollViewContainer: {
    marginTop: 80,  // Space for top section
    paddingBottom: 60, // Space for navbar at the bottom
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    margin: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  profileImageContainer: {
    alignItems: 'center',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileInfoContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 16,
    color: 'gray',
  },
  balanceText: {
    fontSize: 18,
    marginTop: 10,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#008CBA',
    padding: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retrait: {
    backgroundColor: '#1E90FF',
  },
  depot: {
    backgroundColor: '#1E90FF',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 10,
  },
  cryptoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 15,
    textAlign: 'center'
  },
  cryptoCard: {
    backgroundColor: 'white',
    padding: 15,
    marginVertical: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  cryptoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cryptoLogo: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  cryptoName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cryptoAmount: {
    marginTop: 5,
  },
  cryptoPrice: {
    marginTop: 5,
  },
  navbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1E90FF',
    padding: 10,
    zIndex: 100,
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    color: 'white',
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginVertical: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    padding: 10,
    backgroundColor: '#28A745',
    borderRadius: 5,
  },
  cancelButton: {
    backgroundColor: '#FF5733',
  },
  modalButtonText: {
    color: 'white',
  },
});

export default Profile;