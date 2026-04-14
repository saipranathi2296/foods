const mongoose = require('mongoose');
const Menu = require('./models/Menu');
const Feedback = require('./models/Feedback');
const User = require('./models/User');

const MONGO_URI = 'mongodb://127.0.0.1:27017/auth_db';

async function runTests() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB for testing...');

  try {
    // Attempt to create a menu
    const menuDate = new Date('2026-04-14T00:00:00Z');
    
    await Menu.deleteMany({ date: menuDate });
    
    await Menu.create({
      date: menuDate,
      mealType: 'breakfast',
      items: [{ itemName: 'Dosa' }, { itemName: 'Idli' }]
    });
    console.log('1. First menu created successfully.');

    try {
      await Menu.create({
        date: menuDate,
        mealType: 'breakfast',
        items: [{ itemName: 'Upma' }]
      });
      console.log('❌ Failed: Duplicate menu was created!');
    } catch (err) {
      if (err.code === 11000) {
        console.log('2. Passed: Duplicate menu creation prevented by DB unique constraint.');
      } else {
        console.log('❌ Failed: Unrecognized error on duplicate menu: ', err);
      }
    }

    let student = await User.findOne({ role: 'student' });
    if (!student) {
      student = await User.create({
        name: 'Test Student',
        email: 'student@test.com',
        password: 'password123',
        role: 'student'
      });
    }

    await Feedback.deleteMany({ studentId: student._id, date: menuDate });

    await Feedback.create({
      studentId: student._id,
      date: menuDate,
      mealType: 'breakfast',
      items: [
        { itemName: 'Dosa', response: 'Completely Ate' },
        { itemName: 'Idli', response: 'Did Not Eat', replacementOption: 'Poha' }
      ]
    });
    console.log('3. First feedback submitted successfully.');

    try {
      await Feedback.create({
        studentId: student._id,
        date: menuDate,
        mealType: 'breakfast',
        items: [
          { itemName: 'Dosa', response: 'Partially Ate' }
        ]
      });
      console.log('❌ Failed: Duplicate feedback for the same meal submitted!');
    } catch (err) {
      if (err.code === 11000) {
        console.log('4. Passed: Duplicate feedback creation prevented by DB unique constraint.');
      } else {
        console.log('❌ Failed: Unrecognized error on duplicate feedback: ', err);
      }
    }
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Passed tests execution completed.');
  }
}

runTests();
