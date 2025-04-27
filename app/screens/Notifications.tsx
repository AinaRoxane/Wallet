import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { FIREBASE_DB, FIREBASE_AUTH } from '../../FirebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { getDocs, query, where, collection, updateDoc, doc } from 'firebase/firestore';

const Notifications = ({ navigation }: any) => {
  const user = FIREBASE_AUTH.currentUser;
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const notificationsQuery = query(
          collection(FIREBASE_DB, 'notifications'),
          where('email', '==', user.email)
        );

        const notificationsSnap = await getDocs(notificationsQuery);

        console.log("Fetched Notifications:", notificationsSnap.docs.map(docSnap => docSnap.data()));

        if (!notificationsSnap.empty) {
          const groupedNotifications: any = {};

          notificationsSnap.forEach((docSnap) => {
            const notification = docSnap.data();
            const notificationDate = notification.date.toDate().toISOString().split('T')[0]; // Convert Timestamp to Date and extract the date part

            if (!groupedNotifications[notificationDate]) {
              groupedNotifications[notificationDate] = [];
            }

            groupedNotifications[notificationDate].push({
              id: docSnap.id, // Use Firestore's document ID
              ...notification,
            });
          });

          const notificationsList = Object.keys(groupedNotifications).map((date) => ({
            date,
            notifications: groupedNotifications[date],
          }));

          setNotifications(notificationsList);
        } else {
          console.log('No notifications found for this user.');
          setNotifications([]);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user]);

  const markAsOpened = async (notification: any) => {
    try {
      const notificationRef = doc(FIREBASE_DB, 'notifications', notification.id);
      await updateDoc(notificationRef, { wasOpened: true });

      setNotifications((prevNotifications) =>
        prevNotifications.map((dateGroup) => ({
          ...dateGroup,
          notifications: dateGroup.notifications.filter(
            (notif) => notif.id !== notification.id
          ),
        }))
      );
    } catch (error) {
      console.error('Error marking notification as opened:', error);
    }
  };

  const handleDateClick = (date: string) => {
    setExpandedDate(expandedDate === date ? null : date);
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <ScrollView style={styles.container}>
      {notifications.length === 0 ? (
        <Text style={styles.noNotificationsText}>Aucune notification</Text>
      ) : (
        notifications.map((dateGroup) => (
          <View key={dateGroup.date} style={styles.dateGroup}>
            <TouchableOpacity onPress={() => handleDateClick(dateGroup.date)} style={styles.dateHeader}>
              <Text style={styles.dateHeaderText}>{dateGroup.date}</Text>
              <Ionicons
                name={expandedDate === dateGroup.date ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="black"
              />
            </TouchableOpacity>

            {expandedDate === dateGroup.date && (
              <View style={styles.notificationsList}>
                {dateGroup.notifications.map((notification) => (
                  <View key={notification.id} style={styles.notification}>
                    <Text style={styles.notificationMessage}>{notification.message}</Text>
                    <Text style={styles.notificationCrypto}>Cryptomonnaie: {notification.crypto}</Text>
                    <TouchableOpacity
                      onPress={() => markAsOpened(notification)}
                      style={styles.markAsOpenedButton}>
                      <Text style={styles.buttonText}>Marquer comme ouvert</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: 'white',
    },
    dateGroup: {
      marginBottom: 30,
    },
    dateHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 10,
      backgroundColor: '#e1e1e1',
      borderRadius: 5,
    },
    dateHeaderText: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    notificationsList: {
      paddingLeft: 20,
      marginTop: 10,
    },
    notification: {
      padding: 10,
      backgroundColor: 'white',
      marginBottom: 10,
      borderRadius: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
    },
    notificationMessage: {
      fontSize: 14,
      marginBottom: 5,
    },
    notificationCrypto: {
      fontSize: 12,
      marginBottom: 10,
      color: '#888',
    },
    markAsOpenedButton: {
      backgroundColor: '#007BFF',
      padding: 10,
      borderRadius: 5,
      alignItems: 'center',
    },
    buttonText: {
      color: 'white',
      fontWeight: 'bold',
    },
    noNotificationsText: {
      textAlign: 'center',
      fontSize: 16,
      color: '#888',
    },
  });
  

export default Notifications;
