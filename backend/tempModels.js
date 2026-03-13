const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/.env' });

const Movie = require('./models/Movie');
const Book  = require('./models/Book');
const Game  = require('./models/Game');
const Music = require('./models/Music');
const User  = require('./models/User');

const test = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Check all models load correctly
  console.log('✅ Movie fields  :', Object.keys(Movie.schema.paths));
  console.log('✅ Book fields   :', Object.keys(Book.schema.paths));
  console.log('✅ Game fields   :', Object.keys(Game.schema.paths));
  console.log('✅ Music fields  :', Object.keys(Music.schema.paths));
  console.log('✅ User fields   :', Object.keys(User.schema.paths));

  // Test password hashing
  const testUser = new User({
    name: 'Test User', email: 'test@test.com', password: '123456'
  });
  await testUser.save();
  const match = await testUser.matchPassword('123456');
  console.log('✅ Password hash works:', match);

  // Cleanup test user
  await User.deleteOne({ email: 'test@test.com' });
  console.log('✅ Cleanup done');

  await mongoose.disconnect();
  console.log('\n🎉 All models are working correctly!');
};

test().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});