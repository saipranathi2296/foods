require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const SwapItem = require('./models/SwapItem');
const User = require('./models/User');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const lastItems = await SwapItem.find()
          .populate('studentId', 'name')
          .sort({ createdAt: -1 })
          .limit(3);
        console.log("LAST 3 ITEMS IN DB:");
        console.log(JSON.stringify(lastItems, null, 2));

    } catch (e) {
        console.error("DB Error:", e);
    } finally {
        process.exit();
    }
};

run();
