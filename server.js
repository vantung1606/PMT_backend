const dotenv = require('dotenv');
dotenv.config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const fs = require('fs');
const path = require('path');

const loadOptionalRoute = (relativePath) => {
  const absolutePath = path.join(__dirname, relativePath);

  if (!fs.existsSync(absolutePath)) {
    console.warn(`[WARN] Missing route file: ${relativePath}. Using empty router.`);
    return express.Router();
  }

  return require(`./${relativePath.replace(/\\/g, '/')}`);
};

const loadSocketInitializer = () => {
  const relativePath = 'socket/socketServer.js';
  const absolutePath = path.join(__dirname, relativePath);

  if (!fs.existsSync(absolutePath)) {
    console.warn(`[WARN] Missing socket server file: ${relativePath}. Socket disabled.`);
    return () => {};
  }

  const socketModule = require('./socket/socketServer');
  if (typeof socketModule.initializeSocket !== 'function') {
    console.warn('[WARN] socket/socketServer.js does not export initializeSocket(). Socket disabled.');
    return () => {};
  }

  return socketModule.initializeSocket;
};

const initializeSocket = loadSocketInitializer();
const authRoutes = loadOptionalRoute('routes/authRoutes.js');
const projectRoutes = loadOptionalRoute('routes/projectRoutes.js');
const taskRoutes = loadOptionalRoute('routes/taskRoutes.js');
const taskAssignmentRoutes = loadOptionalRoute('routes/taskAssignmentRoutes.js');
const userRoutes = loadOptionalRoute('routes/userRoutes.js');
const memberRoutes = loadOptionalRoute('routes/memberRoutes.js');
const commentRoutes = loadOptionalRoute('routes/commentRoutes.js');
const projectCommentRoutes = loadOptionalRoute('routes/projectCommentRoutes.js');
const notificationRoutes = loadOptionalRoute('routes/notificationRoutes.js');
const reportRoutes = loadOptionalRoute('routes/reportRoutes.js');
const aiRoutes = loadOptionalRoute('routes/aiRoutes.js');
const workspaceRoutes = loadOptionalRoute('routes/workspaceRoutes.js');
const adminRoutes = loadOptionalRoute('routes/adminRoutes.js');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3036;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.use(helmet());

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(compression());


const bodySizeLimit = process.env.BODY_SIZE_LIMIT || '10mb';
app.use(express.json({ limit: bodySizeLimit }));
app.use(express.urlencoded({ extended: true, limit: bodySizeLimit }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: NODE_ENV 
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/task-assignments', taskAssignmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/project-comments', projectCommentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use(errorHandler);
const server = http.createServer(app);
initializeSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${NODE_ENV} mode`);
  console.log(`Socket.io initialized and ready for connections`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});
