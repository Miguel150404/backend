// Importación de módulos necesarios
const express = require('express'); // Framework para crear servidores web
const cors = require('cors'); // Middleware para permitir solicitudes de diferentes dominios
const db = require('./config/firebase'); // Conexión a la base de datos de Firebase
const { enviarCorreoBienvenida } = require('./mailer'); // Función para enviar correos electrónicos
const paypalRoutes = require('./routes/paypal'); // Rutas relacionadas con PayPal
const axios = require('axios'); // Cliente HTTP para hacer peticiones externas

const app = express(); // Se crea una instancia de Express

// Middleware globales
app.use(cors()); // Permite solicitudes CORS
app.use(express.json()); // Permite parsear JSON en las peticiones

// Servir archivos estáticos del frontend compilado (Angular, React, etc.)
//app.use(express.static(__dirname + '/dist/ProyectoFinal_front'));

// Ruta comodín para enviar el index.html en caso de rutas SPA
//app.get('*', (req, res) => {
  //res.sendFile(__dirname + '/dist/ProyectoFinal_front/index.html');
//});

// Función para verificar el token de reCAPTCHA con Google
async function verificarCaptcha(token) {
  const secret = process.env.RECAPTCHA_SECRET;
  const respuesta = await axios.post(`https://www.google.com/recaptcha/api/siteverify`, null, {
    params: { secret, response: token }
  });
  return respuesta.data.success;
}

// ============================
// RUTAS DE USUARIOS
// ============================

// Obtener todos los usuarios
app.get('/api/usuarios', async (req, res) => {
  try {
    const snapshot = await db.collection('usuarios').get();
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar un usuario por ID
app.delete('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.collection('usuarios').doc(id).delete();
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Agregar nuevo usuario con verificación CAPTCHA y envío de correo
app.post('/api/usuarios', async (req, res) => {
  const { captcha, ...nuevoUsuario } = req.body;

  const captchaVerificado = await verificarCaptcha(captcha);
  if (!captchaVerificado) {
    return res.status(400).json({ error: 'Captcha inválido o expirado.' });
  }

  try {
    const ref = await db.collection('usuarios').add(nuevoUsuario);

    // Enviar correo de bienvenida si hay correo y nombre
    if (nuevoUsuario.correo && nuevoUsuario.nombre) {
      enviarCorreoBienvenida(nuevoUsuario.correo, nuevoUsuario.nombre)
        .then(() => console.log('Correo enviado correctamente'))
        .catch(err => console.error('Error al enviar correo:', err));
    }

    res.status(201).json({ id: ref.id, ...nuevoUsuario });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar un usuario existente
app.put('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.collection('usuarios').doc(id).update(req.body);
    res.json({ message: 'Usuario actualizado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bloquear o desbloquear usuario con registro en bitácora
app.put('/api/usuarios/:id/bloqueo', async (req, res) => {
  const { id } = req.params;
  const { estado, motivo, realizadoPor } = req.body;

  try {
    const usuarioRef = db.collection('usuarios').doc(id);
    await usuarioRef.update({ estado });

    const bitacoraRef = db.collection('bitacoraBloqueos').doc();
    await bitacoraRef.set({
      accion: estado ? 'desbloqueado' : 'bloqueado',
      fecha: new Date(),
      motivo,
      realizadoPor: `/usuarios/${realizadoPor}`,
      usuarioAfectado: `/usuarios/${id}`
    });

    res.json({ message: `Usuario ${estado ? 'desbloqueado' : 'bloqueado'} correctamente.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================
// RUTAS DE PRODUCTOS
// ============================

// Obtener todos los productos
app.get('/api/productos', async (req, res) => {
  try {
    const snapshot = await db.collection('productos').get();
    const productos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Agregar producto nuevo
app.post('/api/productos', async (req, res) => {
  try {
    const nuevoProducto = req.body;
    const ref = await db.collection('productos').add(nuevoProducto);
    res.status(201).json({ id: ref.id, ...nuevoProducto });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Editar producto existente
app.put('/api/productos/:id', async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  try {
    await db.collection('productos').doc(id).update(data);
    res.json({ message: 'Producto actualizado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar producto
app.delete('/api/productos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.collection('productos').doc(id).delete();
    res.json({ message: 'Producto eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener un producto por ID
app.get('/api/productos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const doc = await db.collection('productos').doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================
// RUTA DE COMPRAS
// ============================

// Registrar una nueva compra con productos y usuario
app.post('/api/compras-productos', async (req, res) => {
  try {
    const { idUsuario, productos, total } = req.body;

    const compraRef = db.collection('comprasProductos').doc();
    await compraRef.set({
      idUsuario: `/usuarios/${idUsuario}`,
      fecha: new Date(),
      productos: productos.map(p => ({
        producto: `/productos/${p.id}`,
        cantidad: p.cantidad
      })),
      total
    });

    res.status(201).json({ message: 'Compra registrada correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================
// RUTAS DE SUBSCRIPCIONES
// ============================

// Obtener todas las suscripciones
app.get('/api/subscripciones', async (req, res) => {
  try {
    const snapshot = await db.collection('subscripciones').get();
    const subs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(subs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================
// RUTAS DE REPORTES / GRÁFICAS
// ============================

// Reporte: usuarios por tipo (admin / cliente)
app.get('/api/reportes/usuarios-tipo', async (req, res) => {
  try {
    const snapshot = await db.collection('usuarios').get();
    const conteo = { admin: 0, cliente: 0 };

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.tipo === 'admin') conteo.admin++;
      else if (data.tipo === 'cliente') conteo.cliente++;
    });

    res.json(conteo);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios por tipo' });
  }
});

// Reporte: clientes por tipo de suscripción (1, 2, 3)
app.get('/api/reportes/suscripciones', async (req, res) => {
  try {
    const snapshot = await db.collection('usuarios').get();
    const conteo = { '1': 0, '2': 0, '3': 0 };

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.tipo === 'cliente' && ['1', '2', '3'].includes(data.subscripcion)) {
        conteo[data.subscripcion]++;
      }
    });

    res.json(conteo);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios por suscripción' });
  }
});

// ============================
// RUTAS DE PAYPAL
// ============================

// Montar rutas específicas de PayPal en /api/paypal
app.use('/api/paypal', paypalRoutes);

// ============================
// INICIAR SERVIDOR
// ============================

// Iniciar servidor en el puerto definido en .env o por defecto 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor Node escuchando en puerto ${PORT}`));
