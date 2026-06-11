const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());
app.get('/', (req, res) => {
  if (req.query.zona) {
    res.sendFile('index.html', { root: './public' });
  } else {
    res.redirect('/login.html');
  }
});
app.use(express.static('public'));

// Rutas
const alertas = require('./routes/alertas');
const zonas = require('./routes/zonas');
const usuarios = require('./routes/usuarios');
const asistente = require('./routes/asistente');
const resoluciones = require('./routes/resoluciones');

app.use('/api/resoluciones', resoluciones);
app.use('/api/alertas', alertas);
app.use('/api/zonas', zonas);
app.use('/api/usuarios', usuarios);
app.use('/api/asistente', asistente);

// Socket.io


io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('nueva_alerta', (data) => {
    io.emit('alerta_recibida', data);
  });


  // Nuevo: en camino
  socket.on('doctor_en_camino', (data) => {
    io.emit('doctor_en_camino', data);
  });

  // Nuevo: alerta resuelta
  socket.on('alerta_resuelta', (data) => {
    io.emit('alerta_resuelta', data);
  });

  // Nuevo: alerta falsa
  socket.on('alerta_falsa', (data) => {
    io.emit('alerta_falsa', data);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});