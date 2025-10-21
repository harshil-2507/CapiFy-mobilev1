// capify-mobile/api/axios.js

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ⚠️ IMPORTANT: If testing on a physical phone, replace 'localhost' with your actual local IP address (e.g., "http://192.168.1.10:8080")
// You can keep it as 'localhost' if testing on an iOS/Android simulator/emulator.

const API = axios.create({
    baseURL: "http://10.167.75.155:8080", // Updated to use local IP instead of localhost
    headers: {
        "Content-Type": "application/json",
    },
});

// Add request interceptor to include JWT token
API.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.log('Error getting token from storage:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle token expiration
API.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userData');
            // You might want to redirect to login screen here
            console.log('Token expired, please login again');
        }
        return Promise.reject(error);
    }
);

export default API;
