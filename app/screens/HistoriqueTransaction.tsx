import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { FIREBASE_DB, FIREBASE_AUTH } from '../../FirebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

const HistoriqueTransaction = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const email = FIREBASE_AUTH.currentUser?.email;
        if (!email) return;

        const transactionsRef = collection(FIREBASE_DB, 'historiques');
        const q = query(transactionsRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);

        const transactionsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTransactions(transactionsList);
      } catch (error) {
        console.error('Erreur lors de la récupération des transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  if (loading) {
    return <Text style={styles.loadingText}>Chargement des transactions...</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historique des Transactions</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.headerCell}>Crypto</Text>
          <Text style={styles.headerCell}>Type</Text>
          <Text style={styles.headerCell}>Montant</Text>
          <Text style={styles.headerCell}>État</Text>
          <Text style={styles.headerCell}>Date</Text>
        </View>
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const rowBackgroundColor = item.typetransaction === 'depot' ? '#f8d7da' : '#d4edda'; // Green for depot, red for retrait
            return (
              <View style={[styles.row, { backgroundColor: rowBackgroundColor }]}>
                <Text style={styles.cell}>{item.cyptoname}</Text>
                <Text style={styles.cell}>{item.etattransaction}</Text>
                <Text style={styles.cell}>{item.amount}</Text>
                <Text style={styles.cell}>{item.typetransaction}</Text>
                <Text style={styles.cell}>{new Date(item.made_at.seconds * 1000).toLocaleString()}</Text>
              </View>
            );
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f2f2f2',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#fff', // Header background color changed to white
    padding: 10,
    borderRadius: 8,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  headerCell: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 8,
    marginVertical: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cell: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});

export default HistoriqueTransaction;