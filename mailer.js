// Importa la librería nodemailer, que permite enviar correos electrónicos desde Node.js
const nodemailer = require('nodemailer');

// Configuración del transporte de correo (en este caso con el servicio Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail', // Se utiliza el servicio de correo de Gmail
  auth: {
    user: 'brunomax090@gmail.com', // Correo electrónico que enviará los mensajes
    pass: 'krao fzfy bsut zbar'     // Contraseña de aplicación generada en la cuenta de Gmail
  }
});

// Función que envía un correo de bienvenida
function enviarCorreoBienvenida(destinatario, nombre) {
  // Opciones del correo que se va a enviar
  const mailOptions = {
    from: '"Animal Gym" <tucorreo@gmail.com>', // Remitente del mensaje con nombre personalizado
    to: destinatario,                          // Dirección de correo del destinatario
    subject: 'Bienvenido a Animal Gym',        // Asunto del correo
    html: `                                    // Contenido HTML del mensaje
      <h2>Hola ${nombre} 👋</h2>
      <p>Tu cuenta ha sido creada exitosamente en <strong>Animal Gym</strong>.</p>
      <p>¡Gracias por formar parte de nuestra comunidad!</p>
    `
  };

  // Retorna la promesa de envío del correo, que se puede usar con .then() o await
  return transporter.sendMail(mailOptions);
}

// Exporta la función para que pueda ser utilizada en otros archivos
module.exports = { enviarCorreoBienvenida };

/*
Código comentado que usa Outlook como proveedor de correo electrónico

// Crea un nuevo transporte utilizando SMTP de Outlook
const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',   // Servidor SMTP de Outlook
  port: 587,                    // Puerto seguro para STARTTLS
  secure: false,                // Indica que se usará STARTTLS, no SSL puro
  auth: {
    user: 'brunotrax2004@outlook.com', // Correo que se usará como remitente
    pass: 'Pinkfloyd2021'              // Contraseña de ese correo (no recomendable en texto plano)
  },
  tls: {
    rejectUnauthorized: false, // Permite certificados no verificados (útil en desarrollo)
    ciphers: 'SSLv3'            // Especifica el cifrado (opcional)
  }
});

// Función asíncrona para enviar correos personalizados con asunto y HTML
export async function enviarCorreo(destinatario, asunto, mensajeHtml) {
  try {
    // Envía el correo usando los datos recibidos como parámetros
    const info = await transporter.sendMail({
      from: '"Animal Gym" <tu_correo@outlook.com>', // Remitente
      to: destinatario,                             // Destinatario
      subject: asunto,                              // Asunto
      html: mensajeHtml                             // Contenido HTML del correo
    });

    // Muestra el ID del mensaje enviado en consola
    console.log('Correo enviado:', info.messageId);
  } catch (error) {
    // Muestra cualquier error que ocurra durante el envío
    console.error('Error al enviar correo:', error);
  }
}
*/
