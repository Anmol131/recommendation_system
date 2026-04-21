const express = require('express');
const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');

const router = express.Router();

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