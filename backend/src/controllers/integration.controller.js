'use strict';

const externalApi = require('../services/externalApi.service');

async function status(req, res) {
  const data = await externalApi.getStatus();
  res.json({ success: true, data });
}

async function call(req, res) {
  const { method, url, path, data, params, headers } = req.body;
  const result = await externalApi.request({ method, url, path, data, params, headers });
  res.json({ success: true, data: result });
}

module.exports = { status, call };
