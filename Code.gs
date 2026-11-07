/**
 * ============================================================
 * QUAN TRỌNG:
 * Deploy > Manage deployments > Edit:
 *   - Execute as: Me
 *   - Who has access: Anyone  (KHÔNG chọn "Anyone within [tổ chức]")
 * ============================================================
 *
 * CÁC TRANG CỦA WEB APP:
 * - Dành cho học sinh: URL mặc định (.../exec)
 * - Dành cho quản trị: URL có thêm ?page=admin (.../exec?page=admin)
 *
 * SỬA CẤU HÌNH (Có thể chỉnh qua trang Admin hoặc tab "Config" trong Sheet):
 *   - B2: Tên trường
 *   - B3: Tiêu đề phong trào
 *   - B4: Ghi chú nhỏ
 *   - B5: Mật khẩu trang Admin (mặc định: admin123)
 *   - A7 trở xuống: danh sách Tuần hoạt động (mỗi dòng 1 tuần)
 *   - D1: TRUE/FALSE - có tạo thêm thư mục con theo Lớp trong mỗi Tuần hay không
 * Sửa xong không cần deploy lại, web app tự đọc giá trị mới.
 */

var SPREADSHEET_ID = 'DÁN_ID_SHEET_CỦA_BẠN';
var MAIN_FOLDER_ID = 'DÁN_ID_THƯ_MỤC_DRIVE_CỦA_BẠN';

function doGet(e) {
  var page = (e && e.parameter && e.parameter.page) || '';
  if (page.toLowerCase() === 'admin') {
    return HtmlService.createHtmlOutputFromFile('Admin')
      .setTitle('Quản Trị - Thu Hình Ảnh Hoạt Động Đoàn')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Thu Hình Ảnh Hoạt Động Đoàn')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Chạy tay 1 lần trong Apps Script editor (nút Run) để tạo sẵn tab Config nếu muốn
function taoConfigMacDinh() {
  getOrCreateConfigSheet_();
}

function checkConfigured_() {
  if (!SPREADSHEET_ID || SPREADSHEET_ID === 'DÁN_ID_SHEET_CỦA_BẠN') {
    throw new Error('Chưa điền SPREADSHEET_ID thực tế trong file Code.gs.');
  }
}

function getOrCreateConfigSheet_() {
  checkConfigured_();
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var configSheet = ss.getSheetByName('Config');

  if (!configSheet) {
    configSheet = ss.insertSheet('Config');
    configSheet.getRange('A1:B1').setValues([['Key', 'Value']]);
    configSheet.getRange('A1:B1').setFontWeight('bold');
    configSheet.getRange('A2:B5').setValues([
      ['TenTruong', 'Trường THPT Phan Việt Thống'],
      ['TieuDe', 'Web Thu Hình Ảnh\nHoạt Động Đoàn'],
      ['GhiChu', 'KHKT 2026-2027'],
      ['AdminPassword', 'admin123']
    ]);
    configSheet.getRange('A6').setValue('Danh sách Tuần (mỗi dòng 1 lựa chọn, bắt đầu từ A7):');
    configSheet.getRange('A6').setFontWeight('bold');
    configSheet.getRange('A7:A10').setValues([['Tuần 1'], ['Tuần 2'], ['Tuần 3'], ['Tuần 4']]);
    configSheet.autoResizeColumns(1, 2);
  }

  // Đảm bảo có ô cấu hình AdminPassword nếu là sheet cũ
  var adminPassVal = configSheet.getRange('B5').getValue();
  if (!adminPassVal) {
    configSheet.getRange('A5').setValue('AdminPassword');
    configSheet.getRange('B5').setValue('admin123');
  }

  // Đảm bảo có ô cấu hình "Tạo thư mục theo Lớp" (tự thêm cho cả sheet cũ nếu chưa có)
  var subfolderLabel = configSheet.getRange('C1').getValue();
  if (!subfolderLabel) {
    configSheet.getRange('C1').setValue('Tạo thư mục theo Lớp? (TRUE/FALSE)');
    configSheet.getRange('C1').setFontWeight('bold');
    configSheet.getRange('D1').setValue(false);
    configSheet.autoResizeColumns(3, 2);
  }

  return configSheet;
}

function getSubfolderByClassSetting_(configSheet) {
  var val = configSheet.getRange('D1').getValue();
  return val === true || val === 'TRUE' || val === 'true';
}

function sanitizeForFileName_(str) {
  return (str || '').toString()
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '_')
    .trim();
}

// Trang trí 1 tab Tuần: header tô màu, đóng băng dòng đầu, kẻ sọc xen kẽ, canh cột
function formatWeekSheet_(sheet) {
  var headerRange = sheet.getRange(1, 1, 1, 5);
  headerRange.setBackground('#1C2541');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setVerticalAlignment('middle');
  headerRange.setHorizontalAlignment('center');
  sheet.setRowHeight(1, 34);
  sheet.setFrozenRows(1);

  sheet.setColumnWidth(1, 65);  // STT
  sheet.setColumnWidth(2, 190); // Họ và tên
  sheet.setColumnWidth(3, 90);  // Lớp
  sheet.setColumnWidth(4, 150); // Thời gian
  sheet.setColumnWidth(5, 130); // Link ảnh

  var wholeRange = sheet.getRange(1, 1, 2000, 5);
  wholeRange.setBorder(true, true, true, true, true, true, '#E5E1D6', SpreadsheetApp.BorderStyle.SOLID);

  var dataRange = sheet.getRange(2, 1, 1999, 5);
  dataRange.setVerticalAlignment('middle');
  sheet.getRange(2, 1, 1999, 1).setHorizontalAlignment('center'); // Cột STT căn giữa
  sheet.getRange(2, 3, 1999, 1).setHorizontalAlignment('center'); // Cột Lớp căn giữa
  sheet.getRange(2, 4, 1999, 1).setHorizontalAlignment('center'); // Cột Thời gian căn giữa
  sheet.getRange(2, 5, 1999, 1).setHorizontalAlignment('center'); // Cột Link ảnh căn giữa

  var rules = sheet.getConditionalFormatRules().filter(function (r) {
    return r.getRanges().length === 0 ||
      r.getRanges()[0].getA1Notation().indexOf('A2') !== 0;
  });
  var stripeRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=ISEVEN(ROW())')
    .setBackground('#F5F2EC')
    .setRanges([dataRange])
    .build();
  rules.push(stripeRule);
  sheet.setConditionalFormatRules(rules);
}

// Đảm bảo tab Tuần có đủ 5 cột và tiêu đề chuẩn [STT, Họ và tên, Lớp, Thời gian, Link ảnh]
function ensureWeekSheetHeader_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow === 0) {
    sheet.appendRow(["STT", "Họ và tên", "Lớp", "Thời gian", "Link ảnh"]);
    formatWeekSheet_(sheet);
    return;
  }
  var firstCell = sheet.getRange(1, 1).getValue().toString().trim().toUpperCase();
  if (firstCell === 'THỜI GIAN') {
    // Sheet cũ 4 cột (Thời gian ở cột 1) -> chèn cột STT vào cột 1
    sheet.insertColumnBefore(1);
    sheet.getRange(1, 1).setValue('STT');
    formatWeekSheet_(sheet);
  } else if (firstCell !== 'STT') {
    sheet.getRange(1, 1, 1, 5).setValues([["STT", "Họ và tên", "Lớp", "Thời gian", "Link ảnh"]]);
    formatWeekSheet_(sheet);
  }
}

// Chạy tay trong Apps Script editor hoặc từ trang Admin để trang trí lại TẤT CẢ các tab Tuần
function trangTriTatCaCacTuan() {
  checkConfigured_();
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheets = ss.getSheets();
  sheets.forEach(function (sheet) {
    if (sheet.getName() === 'Config') return;
    ensureWeekSheetHeader_(sheet);
    formatWeekSheet_(sheet);
  });
}

function readWeeks_(configSheet) {
  var weeks = [];
  var row = 7;
  while (true) {
    var val = configSheet.getRange('A' + row).getValue();
    if (!val) break;
    weeks.push(val.toString().trim());
    row++;
  }
  return weeks;
}

// Dùng cho trang form học sinh (Index.html) - KHÔNG trả mật khẩu
function getFormConfig() {
  try {
    var configSheet = getOrCreateConfigSheet_();
    var tenTruong = configSheet.getRange('B2').getValue();
    var tieuDe = configSheet.getRange('B3').getValue();
    var ghiChu = configSheet.getRange('B4').getValue();
    var weeks = readWeeks_(configSheet);

    var adminUrl = '?page=admin';
    try {
      var serviceUrl = ScriptApp.getService().getUrl();
      if (serviceUrl) {
        adminUrl = serviceUrl + (serviceUrl.indexOf('?') >= 0 ? '&' : '?') + 'page=admin';
      }
    } catch (e) {}

    return {
      tenTruong: tenTruong || 'Trường THPT Phan Việt Thống',
      tieuDe: tieuDe || 'Web Thu Hình Ảnh\nHoạt Động Đoàn',
      ghiChu: ghiChu || '',
      weeks: weeks.length ? weeks : ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'],
      adminUrl: adminUrl
    };
  } catch (err) {
    return {
      tenTruong: 'Trường THPT Phan Việt Thống',
      tieuDe: 'Web Thu Hình Ảnh\nHoạt Động Đoàn',
      ghiChu: 'Chưa cấu hình Sheet',
      weeks: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'],
      adminUrl: '?page=admin',
      error: err.message
    };
  }
}

function uploadFile(base64Data, fileName, fullName, className, week, stt) {
  if (!base64Data || !fileName || !fullName || !className || !week) {
    return "LỖI: Thiếu dữ liệu (họ tên / lớp / tuần / file).";
  }

  var sttNum = parseInt(stt, 10);
  if (isNaN(sttNum) || sttNum <= 0) {
    sttNum = '';
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (e) {
    return "LỖI: Hệ thống đang xử lý người khác, vui lòng thử gửi lại sau vài giây.";
  }

  try {
    var mainFolder;
    try {
      mainFolder = DriveApp.getFolderById(MAIN_FOLDER_ID);
    } catch (e) {
      return "LỖI (Bước mở Drive): " + e.toString();
    }

    var weekFolder;
    try {
      var folders = mainFolder.getFoldersByName(week);
      weekFolder = folders.hasNext() ? folders.next() : mainFolder.createFolder(week);
    } catch (e) {
      return "LỖI (Bước tạo thư mục tuần): " + e.toString();
    }

    var targetFolder = weekFolder;
    try {
      var configSheet = getOrCreateConfigSheet_();
      if (getSubfolderByClassSetting_(configSheet)) {
        var classFolders = weekFolder.getFoldersByName(className);
        targetFolder = classFolders.hasNext() ? classFolders.next() : weekFolder.createFolder(className);
      }
    } catch (e) {
      return "LỖI (Bước tạo thư mục lớp): " + e.toString();
    }

    var mainFile, mainFileUrl;
    try {
      var splitBase = base64Data.split(',');
      if (splitBase.length < 2) {
        return "LỖI: Dữ liệu file gửi lên không hợp lệ.";
      }
      var type = splitBase[0].split(';')[0].replace('data:', '');
      var byteCharacters = Utilities.base64Decode(splitBase[1]);

      // Tạo tên file mới: Lớp_STTxx_HọTên_Tuần_ThờiGian.đuôifile
      var dotIndex = fileName.lastIndexOf('.');
      var ext = dotIndex !== -1 ? fileName.substring(dotIndex + 1) : '';
      var timestampForName = Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd_HHmmss");
      var sttPrefix = sttNum !== '' ? ('STT' + (sttNum < 10 ? '0' + sttNum : sttNum) + '_') : '';
      var newFileName = sanitizeForFileName_(className) + '_' +
                         sttPrefix +
                         sanitizeForFileName_(fullName) + '_' +
                         sanitizeForFileName_(week) + '_' +
                         timestampForName + (ext ? ('.' + ext) : '');

      var blob = Utilities.newBlob(byteCharacters, type, newFileName);

      mainFile = targetFolder.createFile(blob);
      mainFileUrl = mainFile.getUrl();
    } catch (e) {
      return "LỖI (Bước tạo file): " + e.toString();
    }

    try {
      var timestamp = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");
      var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

      var sheet = ss.getSheetByName(week);
      if (!sheet) {
        sheet = ss.insertSheet(week);
        sheet.appendRow(["STT", "Họ và tên", "Lớp", "Thời gian", "Link ảnh"]);
        formatWeekSheet_(sheet);
      } else {
        ensureWeekSheetHeader_(sheet);
      }

      sheet.appendRow([sttNum, fullName, className, timestamp, mainFileUrl]);
      var lastRow = sheet.getLastRow();
      var linkValue = SpreadsheetApp.newRichTextValue()
        .setText("Xem ảnh")
        .setLinkUrl(mainFileUrl)
        .build();
      sheet.getRange(lastRow, 5).setRichTextValue(linkValue);

      // Tự động sắp xếp từ trên xuống dưới theo Lớp và STT
      if (lastRow >= 3) {
        var numDataRows = lastRow - 1;
        var dataRange = sheet.getRange(2, 1, numDataRows, 5);
        dataRange.sort([
          { column: 3, ascending: true }, // Cột Lớp
          { column: 1, ascending: true }  // Cột STT từ nhỏ đến lớn
        ]);
      }
    } catch (e) {
      return "LỖI (Bước ghi Sheet, nhưng file đã lưu tại " + mainFileUrl + "): " + e.toString();
    }

    return mainFileUrl;

  } catch (error) {
    return "LỖI (không xác định): " + error.toString() + " | Stack: " + error.stack;
  } finally {
    lock.releaseLock();
  }
}

// ============================================================
// CÁC HÀM XỬ LÝ PHÍA TRANG ADMIN
// ============================================================

function getAdminPassword_() {
  var configSheet = getOrCreateConfigSheet_();
  var pass = configSheet.getRange('B5').getValue();
  return (pass ? pass.toString().trim() : '') || 'admin123';
}

function verifyAdminPassword(password) {
  try {
    checkConfigured_();
    var realPass = getAdminPassword_();
    if (password && password.toString().trim() === realPass) {
      return {
        success: true,
        spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/' + SPREADSHEET_ID,
        driveFolderUrl: 'https://drive.google.com/drive/folders/' + MAIN_FOLDER_ID
      };
    }
    return { success: false, message: 'Mật khẩu quản trị không đúng!' };
  } catch (err) {
    return { success: false, message: err.message || err.toString() };
  }
}

// Lấy toàn bộ tổng quan hệ thống cho trang Admin
function getAdminOverview(password) {
  var auth = verifyAdminPassword(password);
  if (!auth.success) return auth;

  try {
    var configSheet = getOrCreateConfigSheet_();
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    var tenTruong = configSheet.getRange('B2').getValue();
    var tieuDe = configSheet.getRange('B3').getValue();
    var ghiChu = configSheet.getRange('B4').getValue();
    var subfolderByClass = getSubfolderByClassSetting_(configSheet);
    var weeks = readWeeks_(configSheet);

    var serviceUrl = '';
    try { serviceUrl = ScriptApp.getService().getUrl(); } catch (e) {}

    // Đếm số lượng nộp bài của từng tuần
    var weekStats = weeks.map(function(w) {
      var sheet = ss.getSheetByName(w);
      var count = 0;
      if (sheet) {
        var lastRow = sheet.getLastRow();
        count = Math.max(0, lastRow - 1);
      }
      return {
        name: w,
        count: count,
        sheetExists: !!sheet
      };
    });

    return {
      success: true,
      config: {
        tenTruong: tenTruong || 'Trường THPT Phan Việt Thống',
        tieuDe: tieuDe || 'Web Thu Hình Ảnh\nHoạt Động Đoàn',
        ghiChu: ghiChu || '',
        subfolderByClass: subfolderByClass,
        weeks: weeks
      },
      weekStats: weekStats,
      formUrl: serviceUrl || '',
      spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/' + SPREADSHEET_ID,
      driveFolderUrl: 'https://drive.google.com/drive/folders/' + MAIN_FOLDER_ID
    };
  } catch (err) {
    return { success: false, message: 'Lỗi nạp dữ liệu quản trị: ' + err.toString() };
  }
}

// Lấy danh sách bài nộp chi tiết của 1 tuần
function getAdminSubmissions(password, weekName) {
  var auth = verifyAdminPassword(password);
  if (!auth.success) return auth;

  try {
    checkConfigured_();
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(weekName);

    if (!sheet) {
      return {
        success: true,
        weekName: weekName,
        submissions: [],
        stats: { total: 0, classStats: {} }
      };
    }

    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return {
        success: true,
        weekName: weekName,
        submissions: [],
        stats: { total: 0, classStats: {} }
      };
    }

    var numRows = lastRow - 1;
    var lastCol = Math.max(sheet.getLastColumn(), 5);
    var values = sheet.getRange(2, 1, numRows, lastCol).getValues();
    var headerValues = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var hasSttCol = (headerValues[0] || '').toString().trim().toUpperCase() === 'STT';

    var richTexts = hasSttCol
      ? sheet.getRange(2, 5, numRows, 1).getRichTextValues()
      : sheet.getRange(2, 4, numRows, 1).getRichTextValues();

    var submissions = [];
    var classStats = {};

    for (var i = 0; i < numRows; i++) {
      var rowNumber = i + 2; // Số dòng thực tế trong Sheet (1-based)
      var sttVal = '';
      var nameVal = '';
      var classVal = '';
      var timeVal = '';
      var linkVal = '';

      if (hasSttCol) {
        sttVal = values[i][0];
        nameVal = (values[i][1] || '').toString();
        classVal = (values[i][2] || '').toString().trim();
        timeVal = values[i][3];
        if (richTexts[i] && richTexts[i][0] && richTexts[i][0].getLinkUrl()) {
          linkVal = richTexts[i][0].getLinkUrl();
        } else if (values[i][4]) {
          linkVal = values[i][4].toString();
        }
      } else {
        timeVal = values[i][0];
        nameVal = (values[i][1] || '').toString();
        classVal = (values[i][2] || '').toString().trim();
        if (richTexts[i] && richTexts[i][0] && richTexts[i][0].getLinkUrl()) {
          linkVal = richTexts[i][0].getLinkUrl();
        } else if (values[i][3]) {
          linkVal = values[i][3].toString();
        }
      }

      if (timeVal instanceof Date) {
        timeVal = Utilities.formatDate(timeVal, "GMT+7", "dd/MM/yyyy HH:mm:ss");
      } else {
        timeVal = (timeVal || '').toString();
      }

      if (classVal) {
        classStats[classVal] = (classStats[classVal] || 0) + 1;
      }

      submissions.push({
        rowIndex: rowNumber,
        stt: sttVal,
        timestamp: timeVal,
        fullName: nameVal,
        className: classVal,
        fileUrl: linkVal
      });
    }

    // Sắp xếp tự động từ trên xuống theo Lớp và STT
    submissions.sort(function(a, b) {
      var clsA = (a.className || '').toString();
      var clsB = (b.className || '').toString();
      if (clsA !== clsB) return clsA.localeCompare(clsB);

      var sA = parseInt(a.stt, 10);
      var sB = parseInt(b.stt, 10);
      if (!isNaN(sA) && !isNaN(sB)) return sA - sB;
      if (!isNaN(sA)) return -1;
      if (!isNaN(sB)) return 1;
      return (a.fullName || '').localeCompare(b.fullName || '');
    });

    return {
      success: true,
      weekName: weekName,
      submissions: submissions,
      stats: {
        total: submissions.length,
        classStats: classStats
      }
    };
  } catch (err) {
    return { success: false, message: 'Lỗi tải bài nộp: ' + err.toString() };
  }
}

// Cập nhật cấu hình hệ thống
function adminUpdateConfig(password, newConfig) {
  var auth = verifyAdminPassword(password);
  if (!auth.success) return auth;

  try {
    var configSheet = getOrCreateConfigSheet_();

    if (newConfig.tenTruong !== undefined) {
      configSheet.getRange('B2').setValue(newConfig.tenTruong);
    }
    if (newConfig.tieuDe !== undefined) {
      configSheet.getRange('B3').setValue(newConfig.tieuDe);
    }
    if (newConfig.ghiChu !== undefined) {
      configSheet.getRange('B4').setValue(newConfig.ghiChu);
    }
    if (newConfig.subfolderByClass !== undefined) {
      configSheet.getRange('D1').setValue(!!newConfig.subfolderByClass);
    }

    if (newConfig.weeks && Array.isArray(newConfig.weeks)) {
      var maxRows = configSheet.getMaxRows();
      if (maxRows >= 7) {
        configSheet.getRange(7, 1, maxRows - 6, 1).clearContent();
      }

      var filteredWeeks = newConfig.weeks.filter(function(w) { return !!(w && w.trim()); });
      if (filteredWeeks.length > 0) {
        var weekValues = filteredWeeks.map(function(w) { return [w.trim()]; });
        configSheet.getRange(7, 1, weekValues.length, 1).setValues(weekValues);
      }
    }

    return { success: true, message: 'Đã lưu cấu hình thành công!' };
  } catch (err) {
    return { success: false, message: 'Lỗi lưu cấu hình: ' + err.toString() };
  }
}

// Xóa một bài nộp khỏi Google Sheet
function adminDeleteSubmission(password, weekName, rowIndex) {
  var auth = verifyAdminPassword(password);
  if (!auth.success) return auth;

  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(weekName);
    if (!sheet) return { success: false, message: 'Không tìm thấy tab tuần: ' + weekName };

    var lastRow = sheet.getLastRow();
    if (rowIndex < 2 || rowIndex > lastRow) {
      return { success: false, message: 'Dòng cần xóa không còn tồn tại trên Sheet.' };
    }

    sheet.deleteRow(rowIndex);
    return { success: true, message: 'Đã xóa bài nộp thành công.' };
  } catch (err) {
    return { success: false, message: 'Lỗi khi xóa bài nộp: ' + err.toString() };
  }
}

// Đổi mật khẩu trang Admin
function adminChangePassword(oldPassword, newPassword) {
  var auth = verifyAdminPassword(oldPassword);
  if (!auth.success) {
    return { success: false, message: 'Mật khẩu hiện tại không chính xác!' };
  }

  if (!newPassword || newPassword.toString().trim().length < 4) {
    return { success: false, message: 'Mật khẩu mới phải có ít nhất 4 ký tự!' };
  }

  try {
    var configSheet = getOrCreateConfigSheet_();
    configSheet.getRange('B5').setValue(newPassword.toString().trim());
    return { success: true, message: 'Đổi mật khẩu trang Admin thành công!' };
  } catch (err) {
    return { success: false, message: 'Lỗi khi lưu mật khẩu mới: ' + err.toString() };
  }
}

// Định dạng lại các tab Tuần từ giao diện Admin
function adminFormatAllSheets(password) {
  var auth = verifyAdminPassword(password);
  if (!auth.success) return auth;

  try {
    trangTriTatCaCacTuan();
    return { success: true, message: 'Đã định dạng và kẻ bảng lại tất cả các tab Tuần thành công!' };
  } catch (err) {
    return { success: false, message: 'Lỗi định dạng tab: ' + err.toString() };
  }
}
