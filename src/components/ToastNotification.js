// src/components/ToastNotification.js
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated } from 'react-native';
import { Text, IconButton } from 'react-native-paper';

const ToastNotification = ({ message, visible, type, colors }) => {
    const slideAnim = useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, { toValue: 10, friction: 8, useNativeDriver: true }).start();
        } else {
            Animated.timing(slideAnim, { toValue: -150, duration: 300, useNativeDriver: true }).start();
        }
    }, [visible]);

    if (!visible && slideAnim._value === -150) return null;

    return (
        <Animated.View style={[styles.toast, { transform: [{ translateY: slideAnim }], backgroundColor: type === 'error' ? colors.error : colors.success }]}>
            <IconButton icon={type === 'error' ? "alert-circle" : "check-circle"} iconColor="#FFF" size={24} style={{ margin: 0 }} />
            <Text style={styles.toastText}>{message}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    toast: { position: 'absolute', top: 10, alignSelf: 'center', width: '92%', borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', zIndex: 1000, elevation: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
    toastText: { color: '#FFF', fontWeight: 'bold', fontSize: 16, flex: 1, marginLeft: 5 },
});

export default ToastNotification;