/**
 * WealthyAI V2 - Google Sheets Apps Script Backend API
 * 
 * Instructions:
 * 1. Open your Google Sheet linked to the app.
 * 2. Go to Extensions > Apps Script (ส่วนขยาย > แอปส์สคริปต์).
 * 3. Replace all existing script code with this file's code.
 * 4. Click the Save icon (บันทึก).
 * 5. Click Deploy > New Deployment (การทำให้ใช้งานได้ > การทำให้ใช้งานได้ใหม่).
 * 6. Select "Web app" (เว็บแอป).
 * 7. Set:
 *    - Description: "WealthyAI V2 API"
 *    - Execute as: "Me" (ตัวฉัน)
 *    - Who has access: "Anyone" (ทุกคน)
 * 8. Click Deploy.
 * 9. Copy the new Web App URL (URL ของเว็บแอป) and paste it into the Settings Modal in the WealthyAI app.
 */

// Target spreadsheet ID explicitly from your Google Sheets URL
const SPREADSHEET_ID = "19kcpOaK2dngaYTxTU7MRoSjt8q-_HiOOX9AcFTJoerc";

function getSpreadsheet() {
  try {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (e) {
    return SpreadsheetApp.getActiveSpreadsheet();
  }
}

// Handle GET requests
function doGet(e) {
  return handleResponse(getAllData());
}

// Handle POST requests
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;

    if (action === "getAll") {
      return handleResponse(getAllData());
    } else if (action === "saveAll") {
      return handleResponse(saveAllData(postData));
    } else if (action === "uploadImage") {
      return handleResponse(uploadImageToDrive(postData.base64));
    } else {
      return handleResponse({ success: false, message: "Unknown action" });
    }
  } catch (error) {
    return handleResponse({ success: false, message: error.toString() });
  }
}

// Helper: Form JSON output with CORS headers
function handleResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Fetch all database records from Google Sheet
function getAllData() {
  const ss = getSpreadsheet();
  
  // 1. Get Transactions
  const txSheet = getOrCreateSheet(ss, "Transactions");
  const txRows = txSheet.getDataRange().getValues();
  const transactions = [];
  if (txRows.length > 1) {
    const headers = txRows[0];
    for (let i = 1; i < txRows.length; i++) {
      const row = txRows[i];
      const tx = {};
      for (let j = 0; j < headers.length; j++) {
        tx[headers[j]] = row[j];
      }
      // Ensure numeric types
      if (tx.amount) tx.amount = parseFloat(tx.amount);
      transactions.push(tx);
    }
  }

  // 2. Get Lending records
  const lendSheet = getOrCreateSheet(ss, "Lending");
  const lendRows = lendSheet.getDataRange().getValues();
  const lending = [];
  if (lendRows.length > 1) {
    const headers = lendRows[0];
    for (let i = 1; i < lendRows.length; i++) {
      const row = lendRows[i];
      const lend = {};
      for (let j = 0; j < headers.length; j++) {
        lend[headers[j]] = row[j];
      }
      if (lend.amount) lend.amount = parseFloat(lend.amount);
      lending.push(lend);
    }
  }

  // 3. Get Settings
  const settingsSheet = getOrCreateSheet(ss, "Settings");
  const settingsRows = settingsSheet.getDataRange().getValues();
  let startingCash = 0;
  let startingBank = 0;
  let currentCurrency = "JPY";

  if (settingsRows.length > 1) {
    for (let i = 1; i < settingsRows.length; i++) {
      const key = settingsRows[i][0];
      const val = settingsRows[i][1];
      if (key === "startingCash") startingCash = parseFloat(val) || 0;
      if (key === "startingBank") startingBank = parseFloat(val) || 0;
      if (key === "currentCurrency") currentCurrency = val || "JPY";
    }
  }

  return {
    success: true,
    transactions: transactions,
    lending: lending,
    startingCash: startingCash,
    startingBank: startingBank,
    currentCurrency: currentCurrency
  };
}

// Overwrite Sheets with local app data
function saveAllData(payload) {
  const ss = getSpreadsheet();

  // 1. Save Transactions
  const txSheet = getOrCreateSheet(ss, "Transactions");
  txSheet.clear();
  const txHeaders = ["id", "type", "amount", "category", "date", "description", "wallet", "imageUrl"];
  txSheet.appendRow(txHeaders);
  
  if (payload.transactions && payload.transactions.length > 0) {
    const rows = payload.transactions.map(tx => {
      return txHeaders.map(header => tx[header] !== undefined ? tx[header] : "");
    });
    txSheet.getRange(2, 1, rows.length, txHeaders.length).setValues(rows);
  }

  // 2. Save Lending records
  const lendSheet = getOrCreateSheet(ss, "Lending");
  lendSheet.clear();
  const lendHeaders = ["id", "borrower", "amount", "wallet", "lentDate", "dueDate", "note", "status", "returnedDate", "imageUrl"];
  lendSheet.appendRow(lendHeaders);
  
  if (payload.lending && payload.lending.length > 0) {
    const rows = payload.lending.map(lend => {
      return lendHeaders.map(header => lend[header] !== undefined ? lend[header] : "");
    });
    lendSheet.getRange(2, 1, rows.length, lendHeaders.length).setValues(rows);
  }

  // 3. Save Settings
  const settingsSheet = getOrCreateSheet(ss, "Settings");
  settingsSheet.clear();
  settingsSheet.appendRow(["Key", "Value"]);
  settingsSheet.appendRow(["startingCash", payload.startingCash !== undefined ? payload.startingCash : 0]);
  settingsSheet.appendRow(["startingBank", payload.startingBank !== undefined ? payload.startingBank : 0]);
  settingsSheet.appendRow(["currentCurrency", payload.currentCurrency || "JPY"]);

  return { success: true, message: "Sync saved successfully" };
}

// Upload Base64 image payload to Google Drive and return view URL
function uploadImageToDrive(base64Str) {
  try {
    if (!base64Str) {
      return { success: false, message: "Empty image payload" };
    }

    // Parse base64 header (e.g. data:image/jpeg;base64,xxxx...)
    let contentType = "image/jpeg";
    let base64Data = base64Str;
    const match = base64Str.match(/^data:(image\/[a-z]+);base64,(.+)$/);
    if (match) {
      contentType = match[1];
      base64Data = match[2];
    }

    // Decode base64 bytes to blob
    const decodedBytes = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(decodedBytes, contentType, "receipt_" + Date.now() + ".jpg");

    // Look for or create folder named "WealthyAI_Receipts"
    const folderName = "WealthyAI_Receipts";
    let folder;
    const folders = DriveApp.getFoldersByName(folderName);
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
    }

    // Save image file
    const file = folder.createFile(blob);
    
    // Set view permissions to public so WealthyAI web app can load the img
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Return direct view link
    const fileUrl = file.getUrl();

    return {
      success: true,
      url: fileUrl
    };
  } catch (error) {
    return { success: false, message: "Drive upload failed: " + error.toString() };
  }
}

// Sheet helper helper
function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}
