'use strict';

const reportService = require('../services/report.service');
const ApiError = require('../utils/ApiError');
const { parseCsv } = require('../utils/csv');

function parseFilters(query) {
  return {
    from: query.from || undefined,
    to: query.to || undefined,
    categoryId: query.categoryId ? Number(query.categoryId) : undefined,
    userId: query.userId ? Number(query.userId) : undefined
  };
}

async function salesTabular(req, res) {
  const rows = await reportService.salesRows(parseFilters(req.query));
  res.json({ success: true, data: rows, meta: { count: rows.length } });
}

async function salesSeries(req, res) {
  const groupBy = req.query.groupBy === 'month' ? 'month' : 'day';
  const rows = await reportService.salesSeries({ groupBy, ...parseFilters(req.query) });
  res.json({ success: true, data: rows, meta: { groupBy } });
}

async function summary(req, res) {
  const data = await reportService.summary(parseFilters(req.query));
  res.json({ success: true, data });
}

async function consolidated(req, res) {
  const groupBy = req.query.groupBy === 'month' ? 'month' : 'day';
  const data = await reportService.consolidated({ groupBy, ...parseFilters(req.query) });
  res.json({ success: true, data });
}

async function combined(req, res) {
  const groupBy = req.query.groupBy === 'month' ? 'month' : 'day';
  const data = await reportService.combinedReport({ groupBy, ...parseFilters(req.query) });
  res.json({ success: true, data });
}

async function myReport(req, res) {
  const groupBy = req.query.groupBy === 'month' ? 'month' : 'day';
  const filters = {
    userId: req.user.id,
    from: req.query.from || undefined,
    to: req.query.to || undefined,
    categoryId: req.query.categoryId ? Number(req.query.categoryId) : undefined
  };
  const [rows, series, stats] = await Promise.all([
    reportService.salesRows(filters),
    reportService.salesSeries({ groupBy, ...filters }),
    reportService.summary(filters)
  ]);
  res.json({ success: true, data: { rows, series, summary: stats } });
}

async function exportReport(req, res) {
  const format = req.query.format === 'csv' ? 'csv' : 'json';
  const dataset = req.query.dataset === 'inventory' ? 'inventory' : 'sales';
  const result = await reportService.exportDataset({ dataset, format, ...parseFilters(req.query) });

  res.setHeader('Content-Type', result.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
  res.send(result.body);
}

async function importReport(req, res) {
  const dataset = req.query.dataset || 'inventory';
  if (dataset !== 'inventory') {
    throw ApiError.badRequest('Solo se admite dataset=inventory para importar');
  }

  let rows;
  if (req.file) {
    const content = req.file.buffer.toString('utf8');
    if (req.file.originalname.toLowerCase().endsWith('.json')) {
      const parsed = JSON.parse(content);
      rows = Array.isArray(parsed) ? parsed : parsed.rows;
    } else {
      rows = parseCsv(content);
    }
  } else if (Array.isArray(req.body?.rows)) {
    rows = req.body.rows;
  } else {
    throw ApiError.badRequest('Proporciona un archivo CSV/JSON (campo "file") o un cuerpo JSON con "rows"');
  }

  const created = await reportService.importInventory(rows);
  res.status(201).json({ success: true, data: { imported: created.length, movements: created } });
}

module.exports = {
  salesTabular,
  salesSeries,
  summary,
  consolidated,
  combined,
  myReport,
  exportReport,
  importReport
};
