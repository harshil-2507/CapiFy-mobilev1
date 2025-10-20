// capify-mobile/api/axios.js

import axios from "axios";

// ⚠️ IMPORTANT: If testing on a physical phone, replace 'localhost' with your actual local IP address (e.g., "http://192.168.1.10:8080")
// You can keep it as 'localhost' if testing on an iOS/Android simulator/emulator.

const API = axios.create({
    baseURL: "http://10.167.75.155:8080", // Updated to use local IP instead of localhost
    headers: {
        "Content-Type": "application/json",
    },
});

export default API;
