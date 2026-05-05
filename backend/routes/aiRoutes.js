const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');
const SearchLog = require('../models/SearchLog');
const User = require('../models/User');

const router = express.Router();

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (user) {
      req.user = user;
    }
  } catch (error) {
    // Intentionally ignore optional auth errors to avoid breaking public analyze endpoint.
  }

  return next();
};

const pickDetectedType = (payload) => {
  const contentTypes = Array.isArray(payload?.content_types)
    ? payload.content_types
    : Array.isArray(payload?.contentTypes)
      ? payload.contentTypes
      : [];

  return (
    payload?.domain
    || payload?.detectedType
    || payload?.contentType
    || contentTypes[0]
    || 'unknown'
  );
};

const pickDetectedIntent = (payload) => payload?.detectedIntent || payload?.intent || 'unknown';

router.get('/analyze', optionalAuth, async (req, res) => {
  try {
    const { query, top_n } = req.query;

    const aiResponse = await axios.get('http://localhost:8000/analyze', {
      params: { query, top_n },
      timeout: 30000,
    });

    const payload = aiResponse.data || {};
    const originalQuery = String(query || '').trim();
    const cleanedQuery = payload.cleanedQuery || payload.cleaned_query || payload.clean_query || '';
    const displayQuery = payload.displayQuery || payload.display_query || cleanedQuery || originalQuery;

    payload.originalQuery = payload.originalQuery || originalQuery;
    payload.cleanedQuery = cleanedQuery;
    payload.displayQuery = displayQuery;
    payload.parsedQuery = payload.parsedQuery || {
      originalQuery,
      displayQuery,
      cleanedQuery,
      intent: payload.intent,
      content_types: payload.content_types,
      keywords: payload.keywords,
      tokens: payload.tokens,
    };

    const results = Array.isArray(payload?.results) ? payload.results : [];

    try {
      const searchLog = await SearchLog.create({
        query: originalQuery,
        cleanedQuery,
        displayQuery,
        detectedType: pickDetectedType(payload),
        detectedIntent: pickDetectedIntent(payload),
        resultsCount: results.length,
        userId: req.user?._id || null,
        createdAt: new Date(),
      });
    } catch (logError) {
      console.error('[recommendation] failed to save search log:', logError.message);
    }

    return res.status(aiResponse.status).json(payload);
  } catch (error) {
    if (error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout')) {
      return res.status(504).json({
        success: false,
        message: 'AI recommendation request timed out. Please try again.',
      });
    }

    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch recommendation analysis',
    });
  }
});

router.use(
  '/',
  createProxyMiddleware({
    target: 'http://localhost:8000',
    changeOrigin: true,
    on: {
      proxyReq: fixRequestBody,
    },
    logLevel: 'warn',
  })
);

module.exports = router;
