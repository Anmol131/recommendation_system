const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
	{
		movieId: {
			type: Number,
			sparse: true,
		},
		title: String,
		year: Number,
		genres: [String],
		avgRating: Number,
		ratingCount: Number,
		tmdbId: Number,
		imdbId: Number,
		poster: {
			type: String,
			default: null,
		},
		description: {
			type: String,
			default: null,
		},
		cast: {
			type: [String],
			default: null,
		},
		trailer: {
			type: String,
			default: null,
		},
		mediaType: {
			type: String,
			enum: ['movie', 'tv'],
			default: 'movie',
		},
		enriched: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
	},
);


movieSchema.index({ title: 'text', genres: 'text' });

module.exports = mongoose.model('Movie', movieSchema);
