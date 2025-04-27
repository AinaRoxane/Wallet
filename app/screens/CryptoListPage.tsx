import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Dimensions, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { collection, onSnapshot, doc, updateDoc, getDoc } from "firebase/firestore";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../FirebaseConfig"; // Adjust the import path as needed
import PureChart from 'react-native-pure-chart';
import Icon from "react-native-vector-icons/FontAwesome";

const CryptoListPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favoriteCryptos, setFavoriteCryptos] = useState([]);
  const [userId, setUserId] = useState(null);

  // Get the current user's ID
  useEffect(() => {
    const currentUser = FIREBASE_AUTH.currentUser;
    if (currentUser) {
      setUserId(currentUser.uid);
    }
  }, []);

  // Fetch data from Firestore (cours collection)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(FIREBASE_DB, "cours"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCourses(data);
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  // Fetch the current user's favoriteCryptos
  useEffect(() => {
    if (!userId) return;

    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(FIREBASE_DB, "users", userId));
        if (userDoc.exists()) {
          setFavoriteCryptos(userDoc.data().favoriteCryptos || []);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [userId]);

  // Prepare chart data
  const combinedData = courses.map((crypto) => {
    const dates = Object.keys(crypto.priceHistory || {}).sort((a, b) => new Date(a) - new Date(b));
    const prices = dates.map((date) => crypto.priceHistory[date]);

    return {
      seriesName: crypto.symbol,
      data: prices,
      color: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 1)`,
    };
  });

  // Update courses with the most recent price
  const updatedCourses = courses.map((crypto) => {
    if (crypto.priceHistory) {
      const sortedDates = Object.keys(crypto.priceHistory).sort((a, b) => new Date(b) - new Date(a));
      const mostRecentDate = sortedDates[0];
      crypto.price = crypto.priceHistory[mostRecentDate];
    }
    return crypto;
  });

  // Toggle favorite status
  const toggleFavorite = async (cryptoSymbol) => {
    if (!userId) return;

    const userRef = doc(FIREBASE_DB, "users", userId);
    let updatedFavorites;

    if (favoriteCryptos.includes(cryptoSymbol)) {
      // Remove the symbol from favoriteCryptos
      updatedFavorites = favoriteCryptos.filter((symbol) => symbol !== cryptoSymbol);
    } else {
      // Add the symbol to favoriteCryptos
      updatedFavorites = [...favoriteCryptos, cryptoSymbol];
    }

    // Update local state
    setFavoriteCryptos(updatedFavorites);

    // Update Firestore
    try {
      await updateDoc(userRef, { favoriteCryptos: updatedFavorites });
    } catch (error) {
      console.error("Error updating favorites:", error);
      // Revert local state if Firestore update fails
      setFavoriteCryptos(favoriteCryptos);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <ScrollView style={{ padding: 20, backgroundColor: "#ffffff" }}>
      <PureChart
        data={combinedData}
        type="line"
        width={Dimensions.get("window").width - 40}
        height={Dimensions.get("window").height * 0.3}
        showEvenNumberXaxisLabel={false}
        showYAxisGrid={false}
        showXAxisLabel={true}
        xAxisLabel="Date"
        yAxisLabel="Price"
      />

      {updatedCourses.map((crypto) => (
        <View
          key={crypto.id}
          style={{
            backgroundColor: "#f8f9fa",
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
            flexDirection: "row",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
          }}
        >
          <Image source={{ uri: crypto.logo }} style={{ width: 60, height: 60, borderRadius: 30, marginRight: 16 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>{crypto.name} ({crypto.symbol})</Text>
            <Text style={{ fontSize: 12, color: "#555" }}>Prix actuel: ${crypto.price}</Text>
          </View>
          <TouchableOpacity onPress={() => toggleFavorite(crypto.symbol)}>
            <Icon
              name="star"
              size={24}
              color={favoriteCryptos.includes(crypto.symbol) ? "gold" : "#000"}
            />
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
};

export default CryptoListPage;