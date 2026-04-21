const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
	{
		isbn: {
			type: String,
			unique: true,
			index: true,
		},
		title: String,
		author: String,
		year: Number,
		publisher: String,
		cover: String,
		avgRating: Number,
		ratingCount: Number,
		description: {
			type: String,
			default: null,
		},
		pageCount: {
			type: Number,
			default: null,
		},
		lang: {
			type: String,
			default: null,
		},
		categories: {
			type: [String],
			default: [],
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

bookSchema.index({ title: 'text', author: 'text' }, { default_language: 'english' });

module.exports = mongoose.model('Book', bookSchema);
