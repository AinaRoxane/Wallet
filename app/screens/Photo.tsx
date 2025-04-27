import { StatusBar } from "expo-status-bar";
import React, { useState, useRef, useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View, Image } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as MediaLibrary from 'expo-media-library';
import Slider from '@react-native-community/slider';
import Button from "./components/Button";
import uploadToCloudinary from '../../Cloudinary';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../FirebaseConfig';
import { getFirestore, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';

export default function Photo() {
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const [mediaLibraryPermission, requestMediaLibraryPermission] = MediaLibrary.usePermissions();
    const [cameraProps, setCameraProps] = useState({
        zoom: 0,
        facing: 'front',
        flash: 'on',
        animateShutter: false,
        enableTorch: false,
    });
    const [image, setImage] = useState(null);
    const cameraRef = useRef(null);

    if (!cameraPermission || !mediaLibraryPermission) {
        return <View />;
    }

    if (!cameraPermission.granted || mediaLibraryPermission.status !== 'granted') {
        return (
            <View style={styles.container}>
                <Text>Nous avons besoin de votre accord pour continuer!</Text>
                <TouchableOpacity style={styles.button} onPress={() => {
                    requestCameraPermission();
                    requestMediaLibraryPermission();
                }}>
                    <Text style={styles.buttonText}>Donner les permissions</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const toggleProperty = (prop, option1, option2) => {
        setCameraProps((current) => ({
            ...current,
            [prop]: current[prop] === option1 ? option2 : option1
        }));
    };

    const zoomIn = () => {
        setCameraProps((current) => ({
            ...current,
            zoom: Math.min(current.zoom + 0.1, 1)
        }));
    };

    const zoomOut = () => {
        setCameraProps((current) => ({
            ...current,
            zoom: Math.max(current.zoom - 0.1, 0)
        }));
    };

    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                const picture = await cameraRef.current.takePictureAsync();
                setImage(picture.uri);
            } catch (err) {
                console.log('Error while taking the picture: ', err);
            }
        }
    };

    const savePicture = async () => {
        if (image) {
            try {
                const imageUrl = await uploadToCloudinary(image);
                if (imageUrl) {
                    // 1️⃣ Mise à jour du profil Firebase Auth
                    const user = FIREBASE_AUTH.currentUser;
                    if (user) {
                        await updateProfile(user, { photoURL: imageUrl });
                        console.log("Profil mis à jour :", imageUrl);

                        // 2️⃣ Mise à jour de Firestore dans la collection 'users'
                        const usersRef = collection(FIREBASE_DB, "users");
                        const q = query(usersRef, where("email", "==", user.email));
                        const querySnapshot = await getDocs(q);

                        querySnapshot.forEach(async (doc) => {
                            await updateDoc(doc.ref, { profilePic: imageUrl });
                            console.log("Document Firestore mis à jour !");
                        });

                        alert("Image uploadée et profil mis à jour !");
                    } else {
                        console.error("Aucun utilisateur connecté.");
                    }
                }
            } catch (err) {
                console.error("Erreur lors de l'upload :", err);
            }
        }
    };

    return (
        <View style={styles.container}>
            {!image ? (
                <>
                    <View style={styles.topControlsContainer}>
                        <Button color={'white'} icon='flip-camera-ios' onPress={() => toggleProperty('facing', 'front', 'back')} />
                        <Button color={'white'} icon={cameraProps.flash === 'on' ? 'flash-on' : 'flash-off'} onPress={() => toggleProperty('flash', 'on', 'off')} />
                        <Button color={'white'} icon='animation' color={cameraProps.animateShutter ? 'white' : '#404040'} onPress={() => toggleProperty('animateShutter', true, false)} />
                        <Button color={'white'} icon={cameraProps.enableTorch ? 'flashlight-on' : 'flashlight-off'} onPress={() => toggleProperty('enableTorch', true, false)} />
                    </View> 
                    <CameraView 
                        style={styles.camera} 
                        zoom={cameraProps.zoom}
                        facing={cameraProps.facing}
                        flash={cameraProps.flash}
                        animateShutter={cameraProps.animateShutter}
                        enableTorch={cameraProps.enableTorch}
                        ref={cameraRef}
                    />
                    <View style={styles.sliderContainer}>
                        <Button icon='zoom-out' color={'#1E90FF'}  onPress={zoomOut} />
                        <Slider style={styles.slider} minimumValue={0} maximumValue={1} value={cameraProps.zoom} onValueChange={(value) => setCameraProps((current) => ({ ...current, zoom: value }))} step={0.1} />
                        <Button icon='zoom-in' color={'#1E90FF'} onPress={zoomIn} />
                    </View>
                    <View style={styles.buttonControlsContainer}>
                        <Button icon='camera' size={60} color={'white'} style={{ height: 60 }} onPress={takePicture} />
                    </View>
                </>
            ) : (
                <>
                    <Image source={{ uri: image }} style={styles.camera} />
                    <View style={styles.buttonControlsContainer}>
                        <Button icon='flip-camera-android' onPress={() => setImage(null)} color={'white'} />
                        <Button icon='check' onPress={savePicture} color={'white'}/>
                    </View>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        marginTop: 30,
    },
    button: {
        backgroundColor: '#1E90FF',
        padding: 15,
        margin: 10,
        borderRadius: 5,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
    },
    camera: {
        flex: 1,
        width: '100%'
    },
    topControlsContainer: {
        height: 100,
        backgroundColor: 'black',
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        paddingHorizontal: 10,
    },    
    sliderContainer: {
        position: 'absolute',
        bottom: 120,
        left: 20,
        right: 20,
        flexDirection: 'row'
    },
    slider: {
        flex: 1,
        marginHorizontal: 10,
    },
    buttonControlsContainer: {
        height: 100,
        backgroundColor: 'black',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 30,
    },
    
});
