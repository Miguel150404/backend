// config/paypal-config.js

require('dotenv').config(); // Carga las variables de entorno desde .env

const paypal = require('@paypal/checkout-server-sdk'); // Importa el SDK de PayPal para operaciones en servidor

// Determina el entorno (Sandbox para pruebas)
const environment = new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID,        // Obtiene el Client ID desde las variables de entorno
    process.env.PAYPAL_CLIENT_SECRET     // Obtiene el Client Secret desde las variables de entorno
);

// Crea un cliente HTTP de PayPal
const client = new paypal.core.PayPalHttpClient(environment); // Instancia el cliente HTTP con el entorno configurado

module.exports = { client }; // Exporta el cliente para usarlo en tus rutas
