import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from './app/screens/Login';
import Profile from './app/screens/Profil';
import {onAuthStateChanged, User} from 'firebase/auth';
import { FIREBASE_AUTH } from './FirebaseConfig';
import CryptoListPage from './app/screens/CryptoListPage';
import HistoriqueTransaction from './app/screens/HistoriqueTransaction';
import Notifications from './app/screens/Notifications';
import Photo from './app/screens/Photo';

const Stack = createNativeStackNavigator();
const InsideStack = createNativeStackNavigator();

function InsideLayout(){
  return ( 
    <InsideStack.Navigator>
        <InsideStack.Screen name="My Profile" component={Profile}></InsideStack.Screen>
        <InsideStack.Screen name="Cours en Temps Réel" component={CryptoListPage}></InsideStack.Screen>
        <InsideStack.Screen name="Historiques" component={HistoriqueTransaction}></InsideStack.Screen>
        <InsideStack.Screen name="Notifications" component={Notifications}></InsideStack.Screen>
        <InsideStack.Screen name="Photo" component={Photo}></InsideStack.Screen>
    </InsideStack.Navigator>
  );
}
export default function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    onAuthStateChanged(FIREBASE_AUTH, (user) => {
        console.log('user', user);
        setUser(user);
    } );
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator initialRouteName="Login">
        {user ? (
          <Stack.Screen
            name="Inside"
            component={InsideLayout}
            options={{ headerShown: false }} 
          />
        ) : (

          <Stack.Screen
          name="Login"
          component={Login}
          options={{ title: 'Wallet - authentification', headerShown: false }} 
        />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}