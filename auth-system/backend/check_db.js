require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const Request = require('./models/Request');
const SwapItem = require('./models/SwapItem');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const lastRequests = await Request.find().sort({ createdAt: -1 }).limit(5);
        console.log("LAST 5 REQUESTS:");
        console.log(JSON.stringify(lastRequests, null, 2));

        const lastItems = await SwapItem.find({ exchangeType: 'donate' }).sort({ createdAt: -1 }).limit(3);
        console.log("\nLAST 3 DONATE ITEMS:");
        console.log(JSON.stringify(lastItems, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
};

run();
