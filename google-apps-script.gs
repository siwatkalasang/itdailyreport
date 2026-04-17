/**
 * Google Apps Script for Request Transportation
 * Spreadsheet ID: 1h_5QhDJrfBPv50MmLRwPE1Ftaf6FLpmXsNP9pGb1isk
 * Sheet Name: Request
 */
const SHEET_ID = '1h_5QhDJrfBPv50MmLRwPE1Ftaf6FLpmXsNP9pGb1isk';
const SHEET_NAME = 'Request';

const HEADERS = [
  'requestNumber','staffName','hotel','department','transferType',
  'transferFrom1','transferTo1','transferFrom2','transferTo2',
  'serviceDate','carrierTime','expense','totalBaht','reason','requestBy','requestDate','status','createdAt'
];

function doGet() {
  return jsonOut({ ok: true, message: 'Use POST with action list/create/approve' });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    const action = body.action || 'list';

    if (action === 'list') return jsonOut({ ok: true, items: getAllRows() });
    if (action === 'create') return jsonOut(createRequest(body));
    if (action === 'approve') return jsonOut(approveRequest(body.requestNumber));
    return jsonOut({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function createRequest(body) {
  const sheet = getSheet();
  ensureHeader(sheet);
  const requestNumber = nextRequestNumber(sheet);
  const row = [
    requestNumber, body.staffName || '', body.hotel || '', body.department || '', body.transferType || '',
    body.transferFrom1 || '', body.transferTo1 || '', body.transferFrom2 || '', body.transferTo2 || '',
    body.serviceDate || '', body.carrierTime || '', body.expense || '', Number(body.totalBaht || 0), body.reason || '',
    body.requestBy || '', body.requestDate || '', 'pending', new Date().toISOString()
  ];
  sheet.appendRow(row);
  return { ok: true, requestNumber };
}

function approveRequest(requestNumber) {
  const sheet = getSheet();
  ensureHeader(sheet);
  const rows = sheet.getDataRange().getValues();
  const reqIdx = HEADERS.indexOf('requestNumber');
  const statusIdx = HEADERS.indexOf('status');
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][reqIdx] === requestNumber) {
      sheet.getRange(i + 1, statusIdx + 1).setValue('approved');
      return { ok: true, requestNumber };
    }
  }
  throw new Error('Request not found: ' + requestNumber);
}

function getAllRows() {
  const sheet = getSheet();
  ensureHeader(sheet);
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  return values.slice(1).map(r => {
    const obj = {};
    HEADERS.forEach((h, i) => obj[h] = r[i]);
    return obj;
  }).filter(r => r.requestNumber);
}

function getSheet() {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
}

function ensureHeader(sheet) {
  const first = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  if (first.join('') !== HEADERS.join('')) sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
}

function nextRequestNumber(sheet) {
  const data = sheet.getDataRange().getValues();
  const reqIdx = HEADERS.indexOf('requestNumber');
  let max = 0;
  for (let i = 1; i < data.length; i++) {
    const raw = String(data[i][reqIdx] || '');
    const n = Number(raw.replace('REQ-', ''));
    if (!Number.isNaN(n) && n > max) max = n;
  }
  return `REQ-${String(max + 1).padStart(5, '0')}`;
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
