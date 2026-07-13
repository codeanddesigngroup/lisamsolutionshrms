require('dotenv').config({ quiet: true });

const http = require('http');
const app = require('./app');
const sequelize = require('./config/db');
const { startAttendanceWorker } = require('./services/attendanceWorker');
const { initSocket } = require('./realtime/socket');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
initSocket(server);

async function startServer() {
  try {
    if (process.env.SYNC_DB === 'true') {
      await sequelize.sync({ alter: true });
      console.log('Database synced');
    } else {
      await sequelize.authenticate();
      console.log('Database connected');
    }

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);

      if (process.env.ATTENDANCE_WORKER_ENABLED !== 'false') {
        startAttendanceWorker();
        console.log('Attendance worker started');
      }
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
