// Importa el SDK de administración de Firebase (firebase-admin), necesario para acceder a Firestore y otros servicios desde el backend
const admin = require('firebase-admin');

// Carga el archivo JSON con las credenciales del servicio (clave privada generada desde Firebase)
const serviceAccount = require('../serviceAccountKey.json');

// Inicializa la aplicación de Firebase con las credenciales de servicio
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount) // Se usa el certificado para autenticar como una cuenta de servicio
});

// Obtiene una instancia de la base de datos Firestore
const db = admin.firestore();

// Exporta la instancia de Firestore para poder utilizarla en otros módulos del proyecto
module.exports = db;
