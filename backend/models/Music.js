const mongoose = require('mongoose');

const musicSchema = new mongoose.Schema(
	{
		trackId: {
			type: String,
			unique: true,
			index: true,
		},
		title: String,
		artist: String,
		album: String,
		genre: String,
		popularity: Number,
		explicit: Boolean,
		durationSec: Number,
		cover: {
			type: String,
			default: null,
		},
		previewUrl: {
			type: String,
			default: null,
		},
		spotifyUrl: {
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

musicSchema.index({ title: 'text', artist: 'text' });

module.exports = mongoose.model('Music', musicSchema);
