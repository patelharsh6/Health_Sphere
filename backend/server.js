// Load environment variables FIRST
require('./src/config/env');

const app = require('./src/app');
const connectDB = require('./src/config/db');
const { PORT, NODE_ENV } = require('./src/config/env');
const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log('');
      console.log('══════════════════════════════════════════');
      console.log('   🏥 HealthSphere Backend API');
      console.log('══════════════════════════════════════════');
      console.log(`   🌍 Environment : ${NODE_ENV}`);
      console.log(`   🚀 Server      : http://localhost:${PORT}`);
      console.log(`   📡 API Base    : http://localhost:${PORT}/api`);
      console.log(`   💚 Health Check: http://localhost:${PORT}/api/health`);
      console.log('══════════════════════════════════════════');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
