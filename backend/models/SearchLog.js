const mongoose = require('mongoose');

const searchLogSchema = new mongoose.Schema(
	{
		query: {
			type: String,
			required: true,
			index: true,
		},
		cleanedQuery: {
			type: String,
		},
		displayQuery: {
			type: String,
		},
		detectedType: {
			type: String,
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
		createdAt: {
			type: Date,
			default: Date.now,
		},
		userAgent: {
			type: String,
		},
		ipAddress: {
			type: String,
		},
	},
	{}
);

// Index for time-based queries
searchLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SearchLog', searchLogSchema, 'searchlogs');
