const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const historySchema = new mongoose.Schema(
	{
		type: {
			type: String,
			enum: ['movie', 'book', 'game', 'music'],
		},
		itemId: String,
		action: {
			type: String,
			enum: ['liked', 'viewed', 'rated'],
		},
		rating: {
			type: Number,
			default: null,
		},
		date: {
			type: Date,
			default: Date.now,
		},
	},
	{
		_id: false,
	}
);

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			index: true,
		},
		password: {
			type: String,
			required: true,
		},
		preferences: {
			movies: {
				type: [String],
				default: [],
			},
			books: {
				type: [String],
				default: [],
			},
			games: {
				type: [String],
				default: [],
			},
			music: {
				type: [String],
				default: [],
			},
		},
		history: {
			type: [historySchema],
			default: [],
		},
		avatar: {
			type: String,
			default: 'avatar-1',
		},
	},
	{
		timestamps: true,
	}
);

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return ;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function matchPassword(enteredPassword) {
	return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
