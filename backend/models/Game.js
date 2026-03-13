const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema(
	{
		gameId: {
			type: String,
			unique: true,
			index: true,
		},
		title: String,
		genres: [String],
		platform: {
			type: String,
			enum: ['pc', 'mobile'],
		},
		pcPlatform: {
			type: String,
			default: null,
		},
		releaseYear: {
			type: Number,
			default: null,
		},
		image: String,
		developer: String,
		rating: Number,
		totalReviews: Number,
		recommendations: Number,
		installs: {
			type: String,
			default: null,
		},
		source: {
			type: String,
			enum: ['steam', 'googleplay'],
		},
		description: {
			type: String,
			default: null,
		},
		enriched: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
	}
);

gameSchema.index({ title: 'text', genres: 'text' });
gameSchema.index({ platform: 1 });

module.exports = mongoose.model('Game', gameSchema);
