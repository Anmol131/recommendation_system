const mongoose = require('mongoose');

const searchLogSchema = new mongoose.Schema(
	{
		query: {
			type: String,
			required: true,
			index: true,
		},
		detectedType: {
			type: String,
			enum: ['movie', 'book', 'music', 'game', 'unknown'],
			default: 'unknown',
			index: true,
		},
		detectedIntent: {
			type: String,
		},
		resultsCount: {
			type: Number,
			default: 0,
		},
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			index: true,
		},
		userAgent: {
			type: String,
		},
		ipAddress: {
			type: String,
		},
	},
	{
		timestamps: true,
	}
);

// Index for time-based queries
searchLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SearchLog', searchLogSchema);
