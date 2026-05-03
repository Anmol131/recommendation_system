const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
			index: true,
		},
		type: {
			type: String,
			enum: ['movie', 'book', 'music', 'game'],
			required: true,
			index: true,
		},
		genre: {
			type: String,
		},
		description: {
			type: String,
		},
		year: {
			type: Number,
		},
		language: {
			type: String,
			default: 'English',
		},
		imageUrl: {
			type: String,
		},
		tags: {
			type: [String],
			default: [],
		},
		rating: {
			type: Number,
			min: 0,
			max: 10,
		},
		externalApiId: {
			type: String,
		},
		metadata: {
			type: Map,
			of: String,
			default: {},
		},
	},
	{
		timestamps: true,
	}
);

// Index for text search
contentSchema.index({ title: 'text', description: 'text', genre: 'text', tags: 'text' });
// Index for filtering
contentSchema.index({ type: 1, year: 1, language: 1 });

module.exports = mongoose.model('Content', contentSchema);
