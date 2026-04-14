const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const menuRoutes = require('./routes/menuRoutes');
const leftoverRoutes = require('./routes/leftoverRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const swapItemRoutes = require('./routes/swapItemRoutes');
const requestRoutes = require('./routes/requestRoutes');

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/leftovers', leftoverRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/items', swapItemRoutes);
app.use('/api/requests', requestRoutes);

// Static served folder for uploads
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
