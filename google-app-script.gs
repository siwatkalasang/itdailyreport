const SHEET_ID = '1h_5QhDJrfBPv50MmLRwPE1Ftaf6FLpmXsNP9pGb1isk';
const SHEET_NAME = 'Request';

function doGet(e) {
  const action = e.parameter.action;
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  if (action === 'read') {
    const values = sheet.getDataRange().getValues();
    const headers = values.shift();
    const data = values.map(r => ({
      requestNumber: r[0],
      staffName: r[1],
      hotel: r[2],
      department: r[3],
      transferType: r[4],
      transferFrom1: r[5],
      transferTo1: r[6],
      transferFrom2: r[7],
      transferTo2: r[8],
      serviceDate: r[9],
      carrierTime: r[10],
      expense: r[11],
      total: r[12],
      reason: r[13],
      requestBy: r[14],
      requestDate: r[15],
      status: r[16]
    }));
    return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
  } else if (action === 'get') {
    const reqNum = e.parameter.requestNumber;
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === reqNum) {
        const row = data[i];
        const obj = {
          requestNumber: row[0],
          staffName: row[1],
          hotel: row[2],
          department: row[3],
          transferType: row[4],
          transferFrom1: row[5],
          transferTo1: row[6],
          transferFrom2: row[7],
          transferTo2: row[8],
          serviceDate: row[9],
          carrierTime: row[10],
          expense: row[11],
          total: row[12],
          reason: row[13],
          requestBy: row[14],
          requestDate: row[15],
          status: row[16]
        };
        return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput('{}').setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput('unknown action');
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  if (data.action === 'submit') {
    const lastRow = sheet.getLastRow();
    const nextNum = 'REQ-' + ('00000' + lastRow).slice(-5);
    sheet.appendRow([
      nextNum,
      data.staffName,
      data.hotel,
      data.department,
      data.transferType,
      data.transferFrom1,
      data.transferTo1,
      data.transferFrom2,
      data.transferTo2,
      data.serviceDate,
      data.carrierTime,
      data.expense,
      data.total,
      data.reason,
      data.requestBy,
      data.requestDate,
      'Pending'
    ]);
    return ContentService.createTextOutput(JSON.stringify({result:'success', requestNumber:nextNum})).setMimeType(ContentService.MimeType.JSON);
  } else if (data.action === 'approve') {
    const reqNum = data.requestNumber;
    const range = sheet.getDataRange();
    const values = range.getValues();
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === reqNum) {
        sheet.getRange(i+1,17).setValue('Approved');
        return ContentService.createTextOutput(JSON.stringify({result:'approved'})).setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({result:'not found'})).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({result:'unknown action'})).setMimeType(ContentService.MimeType.JSON);
}
