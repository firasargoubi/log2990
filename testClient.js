const { io } = require("socket.io-client");

console.log("🚀 Test du client WebSocket...");

const socket = io("ws://127.0.0.1:3000");

socket.on("connect", () => {
    console.log("✅ Connecté au serveur WebSocket !");
});

socket.on("connect_error", (err) => {
    console.log("❌ Erreur de connexion :", err);
});
