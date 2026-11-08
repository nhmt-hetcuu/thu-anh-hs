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

// ============================================================
// CẤU HÌNH 2 GOOGLE SPREADSHEET TÁCH BIỆT:
// 1. STUDENT_SPREADSHEET_ID: Bảng tính HỌC SINH (chứa sheet chính "DanhSachHocSinh" và các sheet Hoạt động)
// 2. ADMIN_SPREADSHEET_ID:   Bảng tính QUẢN TRỊ & LOG (chứa sheet "Config", "Log", "DanhSachLop")
// ============================================================
var STUDENT_SPREADSHEET_ID = 'DÁN_ID_SHEET_HOC_SINH_CỦA_BẠN';
var ADMIN_SPREADSHEET_ID   = 'DÁN_ID_SHEET_QUAN_TRI_LOG_CỦA_BẠN';
var MAIN_FOLDER_ID         = 'DÁN_ID_THƯ_MỤC_DRIVE_CỦA_BẠN';

// Giữ lại SPREADSHEET_ID để tương thích ngược nếu chỉ cấu hình 1 file
var SPREADSHEET_ID = typeof SPREADSHEET_ID !== 'undefined' ? SPREADSHEET_ID : STUDENT_SPREADSHEET_ID;

function doGet(e) {
  var page = (e && e.parameter && e.parameter.page) || '';
  var serviceUrl = '';
  try {
    serviceUrl = ScriptApp.getService().getUrl() || '';
  } catch (err) {}
  var baseUrl = serviceUrl ? serviceUrl.split('?')[0] : '';
  var adminUrl = baseUrl ? (baseUrl + '?page=admin') : '?page=admin';
  var formUrl = baseUrl || '#';

  if (page.toLowerCase() === 'admin') {
    var template = HtmlService.createTemplateFromFile('Admin');
    template.formUrl = formUrl;
    template.adminUrl = adminUrl;
    return template.evaluate()
      .setTitle('Quản Trị - Thu Hình Ảnh Hoạt Động Đoàn')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  var template = HtmlService.createTemplateFromFile('Index');
  template.formUrl = formUrl;
  template.adminUrl = adminUrl;
  return template.evaluate()
    .setTitle('Thu Hình Ảnh Hoạt Động Đoàn')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Hàm lấy URL gốc của Web App để client chuyển trang không bị lỗi sandbox googleusercontent
function getScriptServiceUrl() {
  try {
    var url = ScriptApp.getService().getUrl();
    return url ? url.split('?')[0] : '';
  } catch (e) {
    return '';
  }
}

// Chạy tay 1 lần trong Apps Script editor (nút Run) để khởi tạo đầy đủ hệ thống 2 sheet
function taoConfigMacDinh() {
  checkConfigured_();
  var ssStudent = getStudentSpreadsheet_();
  var ssAdmin = getAdminSpreadsheet_();

  // Khởi tạo sheet DanhSachHocSinh trên file Học sinh
  getMainStudentSheet_(ssStudent);
  syncAllSubmissionsToMainSheet_(ssStudent);

  // Khởi tạo các sheet Config, Log, DanhSachLop trên file Quản trị
  getOrCreateConfigSheet_();
  getOrCreateLogSheet_(ssAdmin);
  getOrCreateClassSheet_();

  trangTriTatCaCacTuan();
  writeLog_(ssAdmin, 'Khởi tạo hệ thống', 'Apps Script', '', '', 'Khởi tạo cấu trúc 2 Spreadsheet tách biệt (Học sinh & Quản trị)', '', 'Thành công');
}

function getStudentSpreadsheet_() {
  checkConfigured_();
  var id = (STUDENT_SPREADSHEET_ID && STUDENT_SPREADSHEET_ID !== 'DÁN_ID_SHEET_HOC_SINH_CỦA_BẠN')
    ? STUDENT_SPREADSHEET_ID
    : SPREADSHEET_ID;
  return SpreadsheetApp.openById(id);
}

function getAdminSpreadsheet_() {
  checkConfigured_();
  var id = (ADMIN_SPREADSHEET_ID && ADMIN_SPREADSHEET_ID !== 'DÁN_ID_SHEET_QUAN_TRI_LOG_CỦA_BẠN')
    ? ADMIN_SPREADSHEET_ID
    : ((STUDENT_SPREADSHEET_ID && STUDENT_SPREADSHEET_ID !== 'DÁN_ID_SHEET_HOC_SINH_CỦA_BẠN') ? STUDENT_SPREADSHEET_ID : SPREADSHEET_ID);
  return SpreadsheetApp.openById(id);
}

function checkConfigured_() {
  var sId = (STUDENT_SPREADSHEET_ID && STUDENT_SPREADSHEET_ID !== 'DÁN_ID_SHEET_HOC_SINH_CỦA_BẠN')
    ? STUDENT_SPREADSHEET_ID
    : SPREADSHEET_ID;
  if (!sId || sId === 'DÁN_ID_SHEET_CỦA_BẠN' || sId === 'DÁN_ID_SHEET_HOC_SINH_CỦA_BẠN') {
    throw new Error('Chưa điền STUDENT_SPREADSHEET_ID (hoặc SPREADSHEET_ID) trong file Code.gs.');
  }
}

function getStudentSpreadsheetId_() {
  return (STUDENT_SPREADSHEET_ID && STUDENT_SPREADSHEET_ID !== 'DÁN_ID_SHEET_HOC_SINH_CỦA_BẠN')
    ? STUDENT_SPREADSHEET_ID
    : SPREADSHEET_ID;
}

function getAdminSpreadsheetId_() {
  return (ADMIN_SPREADSHEET_ID && ADMIN_SPREADSHEET_ID !== 'DÁN_ID_SHEET_QUAN_TRI_LOG_CỦA_BẠN')
    ? ADMIN_SPREADSHEET_ID
    : getStudentSpreadsheetId_();
}

function getStudentSpreadsheetUrl_() {
  return 'https://docs.google.com/spreadsheets/d/' + getStudentSpreadsheetId_();
}

function getAdminSpreadsheetUrl_() {
  return 'https://docs.google.com/spreadsheets/d/' + getAdminSpreadsheetId_();
}

// ============================================================
// HÀM TIỆN ÍCH TÊN SHEET, TÊN FILE & ĐỊNH DẠNG NGÀY THÁNG
// ============================================================

function sanitizeSheetName_(str) {
  var s = (str || '').toString()
    .replace(/[\\/:*?\[\]]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  if (s.length > 80) s = s.substring(0, 80).trim();
  return s || 'HoatDong';
}

function sanitizeForFileName_(str, maxLen) {
  var s = (str || '').toString()
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '_')
    .trim();
  if (maxLen && s.length > maxLen) {
    s = s.substring(0, maxLen).replace(/_+$/, '');
  }
  return s;
}

function formatCellDate_(val) {
  if (!val && val !== 0) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, "GMT+7", "dd/MM/yyyy");
  }
  return val.toString().trim();
}

// Định dạng bảng tab Config: header màu navy, kẻ viền, zebra striping, tự động wrap text
function formatConfigSheet_(configSheet) {
  try {
    // 1. Cột độ rộng
    configSheet.setColumnWidth(1, 60);  // STT
    configSheet.setColumnWidth(2, 340); // Tên hoạt động / phong trào
    configSheet.setColumnWidth(3, 140); // Thời gian bắt đầu
    configSheet.setColumnWidth(4, 140); // Thời gian kết thúc
    configSheet.setColumnWidth(5, 170); // Chỉ tiêu (Cả lớp / Đoàn viên)
    configSheet.setColumnWidth(6, 220); // Ghi chú

    // 2. Khối Cấu hình chung (Rows 1 - 5)
    var genHeader = configSheet.getRange('A1:B1');
    genHeader.merge();
    genHeader.setValue('CẤU HÌNH THÔNG TIN CHUNG');
    genHeader.setBackground('#1C2541');
    genHeader.setFontColor('#FFFFFF');
    genHeader.setFontWeight('bold');
    genHeader.setHorizontalAlignment('center');
    genHeader.setVerticalAlignment('middle');
    configSheet.setRowHeight(1, 30);

    var driveHeader = configSheet.getRange('C1:D1');
    driveHeader.merge();
    driveHeader.setValue('TÙY CHỌN DRIVE');
    driveHeader.setBackground('#2E3A59');
    driveHeader.setFontColor('#FFFFFF');
    driveHeader.setFontWeight('bold');
    driveHeader.setHorizontalAlignment('center');
    driveHeader.setVerticalAlignment('middle');

    var cfgKeys = configSheet.getRange('A2:A5');
    cfgKeys.setBackground('#F8FAFC');
    cfgKeys.setFontWeight('bold');
    cfgKeys.setVerticalAlignment('middle');
    cfgKeys.setHorizontalAlignment('left');

    var cfgVals = configSheet.getRange('B2:B5');
    cfgVals.setVerticalAlignment('middle');

    var cfgBox = configSheet.getRange('A1:B5');
    cfgBox.setBorder(true, true, true, true, true, true, '#CBD5E1', SpreadsheetApp.BorderStyle.SOLID);

    var driveBox = configSheet.getRange('C1:D2');
    driveBox.setBorder(true, true, true, true, true, true, '#CBD5E1', SpreadsheetApp.BorderStyle.SOLID);
    configSheet.getRange('C2').setValue('Tạo thư mục theo Lớp? (TRUE/FALSE)');
    configSheet.getRange('C2').setFontWeight('bold');
    configSheet.getRange('C2:D2').setVerticalAlignment('middle');
    configSheet.getRange('D2').setHorizontalAlignment('center');

    // Row 6: Phân cách
    configSheet.setRowHeight(6, 14);

    // Row 7: Banner tiêu đề bảng hoạt động
    var actBanner = configSheet.getRange('A7:F7');
    actBanner.merge();
    actBanner.setValue('DANH SÁCH HOẠT ĐỘNG / PHONG TRÀO THU ẢNH MINH CHỨNG');
    actBanner.setBackground('#D4A017'); // Gold
    actBanner.setFontColor('#1C2541');
    actBanner.setFontWeight('bold');
    actBanner.setFontSize(11);
    actBanner.setHorizontalAlignment('center');
    actBanner.setVerticalAlignment('middle');
    configSheet.setRowHeight(7, 34);

    // Row 8: Tiêu đề các cột của bảng hoạt động
    var tableHeaders = [['STT', 'Tên hoạt động / Phong trào', 'Thời gian bắt đầu', 'Thời gian kết thúc', 'Chỉ tiêu (Cả lớp / Đoàn viên)', 'Ghi chú']];
    var actHeader = configSheet.getRange('A8:F8');
    actHeader.setValues(tableHeaders);
    actHeader.setBackground('#1C2541');
    actHeader.setFontColor('#FFFFFF');
    actHeader.setFontWeight('bold');
    actHeader.setHorizontalAlignment('center');
    actHeader.setVerticalAlignment('middle');
    configSheet.setRowHeight(8, 32);

    // Data rows từ Row 9 trở đi
    var lastRow = configSheet.getLastRow();
    if (lastRow >= 9) {
      var numDataRows = lastRow - 8;
      var dataRange = configSheet.getRange(9, 1, numDataRows, 6);
      dataRange.setVerticalAlignment('middle');
      dataRange.setBorder(true, true, true, true, true, true, '#CBD5E1', SpreadsheetApp.BorderStyle.SOLID);

      configSheet.getRange(9, 1, numDataRows, 1).setHorizontalAlignment('center').setFontWeight('bold');
      configSheet.getRange(9, 2, numDataRows, 1).setHorizontalAlignment('left').setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
      configSheet.getRange(9, 3, numDataRows, 1).setHorizontalAlignment('center');
      configSheet.getRange(9, 4, numDataRows, 1).setHorizontalAlignment('center');
      configSheet.getRange(9, 5, numDataRows, 1).setHorizontalAlignment('center').setFontWeight('bold');
      configSheet.getRange(9, 6, numDataRows, 1).setHorizontalAlignment('left').setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);

      for (var r = 9; r <= lastRow; r++) {
        var rowBg = (r % 2 === 1) ? '#FFFFFF' : '#F8FAFC';
        configSheet.getRange(r, 1, 1, 6).setBackground(rowBg);
        configSheet.setRowHeight(r, 30);
      }
    }
  } catch (e) {
    // Không chặn nếu lỗi định dạng
  }
}

function getOrCreateConfigSheet_(ss) {
  checkConfigured_();
  if (!ss) ss = getAdminSpreadsheet_();
  var configSheet = ss.getSheetByName('Config');

  if (!configSheet) {
    configSheet = ss.insertSheet('Config');
    configSheet.getRange('A2:B5').setValues([
      ['TenTruong', 'Trường THPT Phan Việt Thống'],
      ['TieuDe', 'Web Thu Hình Ảnh\nHoạt Động Đoàn'],
      ['GhiChu', 'KHKT 2026-2027'],
      ['AdminPassword', 'admin123']
    ]);
    configSheet.getRange('D2').setValue(false);

    var sampleActivities = [
      [1, 'Tìm hiểu 94 năm ngày truyền thống thành lập Đoàn TNCS Hồ Chí Minh', '01/03/2025', '10/03/2025', 'Đoàn viên', 'Mỗi đoàn viên nộp 1 ảnh'],
      [2, 'Ra quân Ngày Chủ Nhật Xanh - Vệ sinh môi trường làm sạch trường lớp', '11/03/2025', '18/03/2025', 'Cả lớp', 'Toàn bộ học sinh tham gia'],
      [3, 'Thi đua Tuần học tốt - Hoa điểm 10 chào mừng 26/3', '19/03/2025', '26/03/2025', 'Cả lớp', 'Chụp ảnh sổ đầu bài hoặc điểm tốt'],
      [4, 'Hội thao thanh niên khỏe - Kỷ niệm ngày thành lập Đoàn', '27/03/2025', '31/03/2025', 'Đoàn viên', 'Đoàn viên tham gia các môn thi']
    ];
    configSheet.getRange(9, 1, sampleActivities.length, 6).setValues(sampleActivities);
    formatConfigSheet_(configSheet);
  } else {
    // Đảm bảo các ô cấu hình AdminPassword nếu là sheet cũ
    var adminPassVal = configSheet.getRange('B5').getValue();
    if (!adminPassVal) {
      configSheet.getRange('A5').setValue('AdminPassword');
      configSheet.getRange('B5').setValue('admin123');
    }
  }

  return configSheet;
}

function getSubfolderByClassSetting_(configSheet) {
  if (!configSheet) configSheet = getOrCreateConfigSheet_();
  // Ưu tiên đọc ô D2 (nằm cạnh ô nhãn C2 trong bảng tính)
  var val2 = configSheet.getRange('D2').getValue();
  if (val2 === true || val2 === 'TRUE' || val2 === 'true') return true;
  if (val2 === false || val2 === 'FALSE' || val2 === 'false') return false;
  // Fallback sang ô D1
  var val1 = configSheet.getRange('D1').getValue();
  return val1 === true || val1 === 'TRUE' || val1 === 'true';
}

// ============================================================
// QUẢN LÝ SHEET CHÍNH: DANH SÁCH HỌC SINH (DANH SÁCH TỔNG HỢP)
// ============================================================

function getMainStudentSheet_(ss) {
  if (!ss) ss = getStudentSpreadsheet_();
  var mainSheet = ss.getSheetByName('DanhSachHocSinh');

  if (!mainSheet) {
    // Kiểm tra các tên sheet mặc định khi mới tạo Spreadsheet (Sheet1, Trang tính 1, ...)
    var defaultNames = ['Trang tính 1', 'Trang tính1', 'Sheet1', 'Trang_tính_1'];
    var sheets = ss.getSheets();
    for (var i = 0; i < sheets.length; i++) {
      var sName = sheets[i].getName();
      if (defaultNames.indexOf(sName) >= 0) {
        mainSheet = sheets[i];
        mainSheet.setName('DanhSachHocSinh');
        break;
      }
    }

    if (!mainSheet) {
      mainSheet = ss.insertSheet('DanhSachHocSinh', 0);
    }
  }

  // Đảm bảo DanhSachHocSinh luôn là tab đầu tiên ở góc trái của bảng tính
  try {
    ss.setActiveSheet(mainSheet);
    ss.moveActiveSheet(1);
  } catch (e) {}

  ensureMainStudentSheetHeader_(mainSheet);
  return mainSheet;
}

function formatMainStudentSheet_(sheet) {
  try {
    var headerRange = sheet.getRange(1, 1, 1, 8);
    headerRange.setBackground('#1C2541');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    headerRange.setVerticalAlignment('middle');
    headerRange.setHorizontalAlignment('center');
    sheet.setRowHeight(1, 34);
    sheet.setFrozenRows(1);

    sheet.setColumnWidth(1, 60);  // STT tổng
    sheet.setColumnWidth(2, 85);  // Lớp
    sheet.setColumnWidth(3, 85);  // STT Lớp
    sheet.setColumnWidth(4, 210); // Họ và tên
    sheet.setColumnWidth(5, 320); // Hoạt động / Phong trào
    sheet.setColumnWidth(6, 165); // Thời gian nộp
    sheet.setColumnWidth(7, 140); // Link ảnh minh chứng
    sheet.setColumnWidth(8, 85);  // Lần nộp

    var lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      var numRows = lastRow - 1;
      var dataRange = sheet.getRange(2, 1, numRows, 8);
      dataRange.setVerticalAlignment('middle');
      dataRange.setBorder(true, true, true, true, true, true, '#CBD5E1', SpreadsheetApp.BorderStyle.SOLID);

      sheet.getRange(2, 1, numRows, 1).setHorizontalAlignment('center').setFontWeight('bold');
      sheet.getRange(2, 2, numRows, 2).setHorizontalAlignment('center');
      sheet.getRange(2, 4, numRows, 1).setHorizontalAlignment('left');
      sheet.getRange(2, 5, numRows, 1).setHorizontalAlignment('left').setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
      sheet.getRange(2, 6, numRows, 3).setHorizontalAlignment('center');

      for (var r = 2; r <= lastRow; r++) {
        var rowBg = (r % 2 === 0) ? '#FFFFFF' : '#F8FAFC';
        sheet.getRange(r, 1, 1, 8).setBackground(rowBg);
        sheet.setRowHeight(r, 30);
      }
    }
  } catch (e) {}
}

function ensureMainStudentSheetHeader_(sheet) {
  var headers = [['STT', 'Lớp', 'STT Lớp', 'Họ và tên', 'Hoạt động / Phong trào', 'Thời gian nộp', 'Link ảnh minh chứng', 'Lần nộp']];
  var lastRow = sheet.getLastRow();
  if (lastRow === 0) {
    sheet.getRange(1, 1, 1, 8).setValues(headers);
    formatMainStudentSheet_(sheet);
    return;
  }
  var firstCell = (sheet.getRange(1, 1).getValue() || '').toString().trim().toUpperCase();
  if (firstCell !== 'STT') {
    sheet.getRange(1, 1, 1, 8).setValues(headers);
    formatMainStudentSheet_(sheet);
  } else if (sheet.getLastColumn() < 8) {
    sheet.getRange(1, 8).setValue('Lần nộp');
    formatMainStudentSheet_(sheet);
  }
}

// Đồng bộ toàn bộ bài nộp từ các tab Hoạt động vào Sheet chính nếu Sheet chính chưa có dữ liệu
function syncAllSubmissionsToMainSheet_(ss) {
  try {
    if (!ss) ss = getStudentSpreadsheet_();
    var mainSheet = getMainStudentSheet_(ss);
    if (mainSheet.getLastRow() > 1) return; // Đã có dữ liệu thì không ghi đè

    var configSheet = getOrCreateConfigSheet_();
    if (!configSheet) return;
    var weeks = readWeeks_(configSheet);

    var allRows = [];
    weeks.forEach(function(w) {
      var wName = typeof w === 'object' ? w.name : w;
      var sheet = ss.getSheetByName(sanitizeSheetName_(wName)) || ss.getSheetByName(wName);
      if (!sheet) return;
      var lastRow = sheet.getLastRow();
      if (lastRow <= 1) return;

      var numRows = lastRow - 1;
      var values = sheet.getRange(2, 1, numRows, Math.max(5, sheet.getLastColumn())).getValues();
      var richTexts = sheet.getRange(2, 5, numRows, 1).getRichTextValues();

      for (var i = 0; i < numRows; i++) {
        var sttVal = values[i][0];
        var nameVal = values[i][1];
        var classVal = values[i][2];
        var timeVal = values[i][3];
        var linkVal = '';
        if (richTexts[i] && richTexts[i][0] && richTexts[i][0].getLinkUrl()) {
          linkVal = richTexts[i][0].getLinkUrl();
        } else if (values[i][4]) {
          linkVal = values[i][4].toString();
        }

        if (timeVal instanceof Date) {
          timeVal = Utilities.formatDate(timeVal, "GMT+7", "dd/MM/yyyy HH:mm:ss");
        }

        allRows.push({
          className: (classVal || '').toString().trim(),
          stt: sttVal,
          fullName: (nameVal || '').toString().trim(),
          week: wName,
          timestamp: (timeVal || '').toString(),
          fileUrl: linkVal
        });
      }
    });

    if (allRows.length > 0) {
      allRows.sort(function(a, b) {
        var clsA = (a.className || '').toString();
        var clsB = (b.className || '').toString();
        if (clsA !== clsB) return clsA.localeCompare(clsB, undefined, { numeric: true, sensitivity: 'base' });
        var sA = parseInt(a.stt, 10);
        var sB = parseInt(b.stt, 10);
        if (!isNaN(sA) && !isNaN(sB)) return sA - sB;
        return (a.fullName || '').localeCompare(b.fullName || '');
      });

      var dataToInsert = allRows.map(function(r, idx) {
        return [idx + 1, r.className, r.stt, r.fullName, r.week, r.timestamp, r.fileUrl];
      });

      mainSheet.getRange(2, 1, dataToInsert.length, 7).setValues(dataToInsert);
      for (var k = 0; k < allRows.length; k++) {
        if (allRows[k].fileUrl) {
          var linkItem = SpreadsheetApp.newRichTextValue()
            .setText("Xem ảnh")
            .setLinkUrl(allRows[k].fileUrl)
            .build();
          mainSheet.getRange(k + 2, 7).setRichTextValue(linkItem);
        }
      }
      formatMainStudentSheet_(mainSheet);
    }
  } catch (e) {}
}

// ============================================================
// QUẢN LÝ SHEET CHUYÊN BIỆT: GHI LOG HỆ THỐNG & LỊCH SỬ THAO TÁC
// ============================================================

function getOrCreateLogSheet_(ss) {
  if (!ss) ss = getAdminSpreadsheet_();
  var logSheet = ss.getSheetByName('Log');
  if (!logSheet) {
    logSheet = ss.insertSheet('Log');
    ensureLogSheetHeader_(logSheet);
  } else {
    ensureLogSheetHeader_(logSheet);
  }
  return logSheet;
}

function formatLogSheet_(sheet) {
  try {
    var headerRange = sheet.getRange(1, 1, 1, 8);
    headerRange.setBackground('#1C2541');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    headerRange.setVerticalAlignment('middle');
    headerRange.setHorizontalAlignment('center');
    sheet.setRowHeight(1, 34);
    sheet.setFrozenRows(1);

    sheet.setColumnWidth(1, 165); // Thời gian
    sheet.setColumnWidth(2, 170); // Hành động
    sheet.setColumnWidth(3, 200); // Đối tượng / Học sinh
    sheet.setColumnWidth(4, 85);  // Lớp
    sheet.setColumnWidth(5, 280); // Hoạt động / Phong trào
    sheet.setColumnWidth(6, 260); // Chi tiết / File
    sheet.setColumnWidth(7, 120); // Link Drive
    sheet.setColumnWidth(8, 120); // Trạng thái

    var lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      var numRows = lastRow - 1;
      var dataRange = sheet.getRange(2, 1, numRows, 8);
      dataRange.setVerticalAlignment('middle');
      dataRange.setBorder(true, true, true, true, true, true, '#CBD5E1', SpreadsheetApp.BorderStyle.SOLID);

      sheet.getRange(2, 1, numRows, 1).setHorizontalAlignment('center');
      sheet.getRange(2, 2, numRows, 1).setHorizontalAlignment('center').setFontWeight('bold');
      sheet.getRange(2, 3, numRows, 1).setHorizontalAlignment('left');
      sheet.getRange(2, 4, numRows, 1).setHorizontalAlignment('center');
      sheet.getRange(2, 5, numRows, 1).setHorizontalAlignment('left').setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
      sheet.getRange(2, 6, numRows, 1).setHorizontalAlignment('left').setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
      sheet.getRange(2, 7, numRows, 2).setHorizontalAlignment('center');

      for (var r = 2; r <= lastRow; r++) {
        var rowBg = (r % 2 === 0) ? '#FFFFFF' : '#F8FAFC';
        sheet.getRange(r, 1, 1, 8).setBackground(rowBg);
        sheet.setRowHeight(r, 28);
      }
    }
  } catch (e) {}
}

function ensureLogSheetHeader_(sheet) {
  var headers = [['Thời gian', 'Hành động', 'Đối tượng / Học sinh', 'Lớp', 'Hoạt động / Phong trào', 'Chi tiết / File', 'Link Drive', 'Trạng thái']];
  var lastRow = sheet.getLastRow();
  if (lastRow === 0) {
    sheet.getRange(1, 1, 1, 8).setValues(headers);
    formatLogSheet_(sheet);
    return;
  }
  var firstCell = (sheet.getRange(1, 1).getValue() || '').toString().trim().toUpperCase();
  if (firstCell !== 'THỜI GIAN') {
    sheet.getRange(1, 1, 1, 8).setValues(headers);
    formatLogSheet_(sheet);
  }
}

function writeLog_(ss, action, actor, className, activityName, details, linkUrl, status) {
  try {
    if (!ss) ss = getAdminSpreadsheet_();
    var logSheet = getOrCreateLogSheet_(ss);
    var timestamp = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");

    logSheet.appendRow([
      timestamp,
      action || '',
      actor || '',
      className || '',
      activityName || '',
      details || '',
      linkUrl || '',
      status || 'Thành công'
    ]);

    var lastRow = logSheet.getLastRow();
    if (lastRow >= 2) {
      if (linkUrl) {
        var linkRich = SpreadsheetApp.newRichTextValue()
          .setText("Mở link")
          .setLinkUrl(linkUrl)
          .build();
        logSheet.getRange(lastRow, 7).setRichTextValue(linkRich);
      }
      var rowBg = (lastRow % 2 === 0) ? '#FFFFFF' : '#F8FAFC';
      logSheet.getRange(lastRow, 1, 1, 8).setBackground(rowBg).setVerticalAlignment('middle');
      logSheet.getRange(lastRow, 1).setHorizontalAlignment('center');
      logSheet.getRange(lastRow, 2).setHorizontalAlignment('center').setFontWeight('bold');
      logSheet.getRange(lastRow, 4).setHorizontalAlignment('center');
      logSheet.getRange(lastRow, 7, 1, 2).setHorizontalAlignment('center');
      logSheet.setRowHeight(lastRow, 28);
    }
  } catch (e) {}
}

// ============================================================
// SHEET BÁO KHÔNG THỰC HIỆN ĐƯỢC HOẠT ĐỘNG
// ============================================================

function formatNonCompletionSheet_(sheet) {
  try {
    var headerRange = sheet.getRange(1, 1, 1, 8);
    headerRange.setBackground('#991B1B'); // Đỏ đậm Crimson
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
    headerRange.setVerticalAlignment('middle');
    sheet.setRowHeight(1, 34);
    sheet.setFrozenRows(1);

    sheet.setColumnWidth(1, 60);  // STT
    sheet.setColumnWidth(2, 160); // Thời gian
    sheet.setColumnWidth(3, 90);  // Lớp
    sheet.setColumnWidth(4, 90);  // STT Lớp
    sheet.setColumnWidth(5, 200); // Họ và tên
    sheet.setColumnWidth(6, 260); // Hoạt động / Phong trào
    sheet.setColumnWidth(7, 320); // Lý do không thực hiện
    sheet.setColumnWidth(8, 140); // Ghi chú

    var lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      var numRows = lastRow - 1;
      var dataRange = sheet.getRange(2, 1, numRows, 8);
      dataRange.setVerticalAlignment('middle');
      dataRange.setBorder(true, true, true, true, true, true, '#CBD5E1', SpreadsheetApp.BorderStyle.SOLID);

      sheet.getRange(2, 1, numRows, 1).setHorizontalAlignment('center').setFontWeight('bold');
      sheet.getRange(2, 2, numRows, 1).setHorizontalAlignment('center');
      sheet.getRange(2, 3, numRows, 2).setHorizontalAlignment('center');
      sheet.getRange(2, 5, numRows, 1).setHorizontalAlignment('left').setFontWeight('bold');
      sheet.getRange(2, 6, numRows, 1).setHorizontalAlignment('left').setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
      sheet.getRange(2, 7, numRows, 1).setHorizontalAlignment('left').setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
      sheet.getRange(2, 8, numRows, 1).setHorizontalAlignment('center');

      for (var r = 2; r <= lastRow; r++) {
        var rowBg = (r % 2 === 0) ? '#FFFFFF' : '#FEF2F2';
        sheet.getRange(r, 1, 1, 8).setBackground(rowBg);
        sheet.setRowHeight(r, 30);
      }
    }
  } catch (e) {}
}

function getOrCreateNonCompletionSheet_(ss) {
  checkConfigured_();
  if (!ss) ss = getStudentSpreadsheet_();
  var sheetName = 'BaoKhongThucHien';
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    var headers = [['STT', 'Thời gian báo', 'Lớp', 'STT Lớp', 'Họ và tên', 'Hoạt động / Phong trào', 'Lý do không thực hiện', 'Ghi chú']];
    sheet.getRange(1, 1, 1, 8).setValues(headers);
    formatNonCompletionSheet_(sheet);
  } else {
    var firstCell = (sheet.getRange(1, 1).getValue() || '').toString().trim().toUpperCase();
    if (firstCell !== 'STT') {
      var headers = [['STT', 'Thời gian báo', 'Lớp', 'STT Lớp', 'Họ và tên', 'Hoạt động / Phong trào', 'Lý do không thực hiện', 'Ghi chú']];
      sheet.getRange(1, 1, 1, 8).setValues(headers);
      formatNonCompletionSheet_(sheet);
    }
  }
  return sheet;
}

// Trang trí 1 tab Tuần: header tô màu, đóng băng dòng đầu, kẻ sọc xen kẽ, canh cột
function formatWeekSheet_(sheet) {
  var headerRange = sheet.getRange(1, 1, 1, 6);
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
  sheet.setColumnWidth(6, 85);  // Lần nộp

  var wholeRange = sheet.getRange(1, 1, 2000, 6);
  wholeRange.setBorder(true, true, true, true, true, true, '#E5E1D6', SpreadsheetApp.BorderStyle.SOLID);

  var dataRange = sheet.getRange(2, 1, 1999, 6);
  dataRange.setVerticalAlignment('middle');
  sheet.getRange(2, 1, 1999, 1).setHorizontalAlignment('center'); // Cột STT căn giữa
  sheet.getRange(2, 3, 1999, 1).setHorizontalAlignment('center'); // Cột Lớp căn giữa
  sheet.getRange(2, 4, 1999, 1).setHorizontalAlignment('center'); // Cột Thời gian căn giữa
  sheet.getRange(2, 5, 1999, 1).setHorizontalAlignment('center'); // Cột Link ảnh căn giữa
  sheet.getRange(2, 6, 1999, 1).setHorizontalAlignment('center'); // Cột Lần nộp căn giữa

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

// Đảm bảo tab Tuần có đủ 6 cột và tiêu đề chuẩn [STT, Họ và tên, Lớp, Thời gian, Link ảnh, Lần nộp]
function ensureWeekSheetHeader_(sheet) {
  var lastRow = sheet.getLastRow();
  var standardHeaders = ["STT", "Họ và tên", "Lớp", "Thời gian", "Link ảnh", "Lần nộp"];
  if (lastRow === 0) {
    sheet.appendRow(standardHeaders);
    formatWeekSheet_(sheet);
    return;
  }
  var firstCell = sheet.getRange(1, 1).getValue().toString().trim().toUpperCase();
  if (firstCell === 'THỜI GIAN') {
    // Sheet cũ 4 cột (Thời gian ở cột 1) -> chèn cột STT vào cột 1
    sheet.insertColumnBefore(1);
    sheet.getRange(1, 1).setValue('STT');
  }

  var lastCol = sheet.getLastColumn();
  if (lastCol < 6) {
    sheet.getRange(1, 6).setValue('Lần nộp');
  } else {
    var c6Val = (sheet.getRange(1, 6).getValue() || '').toString().trim();
    if (!c6Val) sheet.getRange(1, 6).setValue('Lần nộp');
  }

  formatWeekSheet_(sheet);
}

// ============================================================
// QUẢN LÝ TAB DANH SÁCH LỚP (SĨ SỐ & SỐ ĐOÀN VIÊN)
// ============================================================

function getOrCreateClassSheet_(ss) {
  checkConfigured_();
  if (!ss) ss = getAdminSpreadsheet_();
  var classSheet = ss.getSheetByName('DanhSachLop');

  if (!classSheet) {
    classSheet = ss.insertSheet('DanhSachLop');
    classSheet.getRange(1, 1, 1, 4).setValues([['Lớp', 'Sĩ số', 'Số đoàn viên', 'Ghi chú']]);
    formatClassSheet_(classSheet);

    // Mẫu một số lớp THPT phổ biến
    var sampleClasses = [
      ['10A1', 42, 35, ''],
      ['10A2', 40, 32, ''],
      ['10A3', 41, 36, ''],
      ['11A1', 40, 38, ''],
      ['11A2', 39, 35, ''],
      ['12A1', 40, 40, ''],
      ['12A2', 41, 41, '']
    ];
    classSheet.getRange(2, 1, sampleClasses.length, 4).setValues(sampleClasses);
    formatClassSheetRows_(classSheet);
  }
  return classSheet;
}

function formatClassSheet_(sheet) {
  var header = sheet.getRange(1, 1, 1, 4);
  header.setBackground('#1C2541');
  header.setFontColor('#FFFFFF');
  header.setFontWeight('bold');
  header.setVerticalAlignment('middle');
  header.setHorizontalAlignment('center');
  sheet.setRowHeight(1, 34);
  sheet.setFrozenRows(1);

  sheet.setColumnWidth(1, 110); // Lớp
  sheet.setColumnWidth(2, 90);  // Sĩ số
  sheet.setColumnWidth(3, 120); // Số đoàn viên
  sheet.setColumnWidth(4, 180); // Ghi chú
}

function formatClassSheetRows_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  var numRows = lastRow - 1;
  var range = sheet.getRange(2, 1, numRows, 4);
  range.setVerticalAlignment('middle');
  sheet.getRange(2, 1, numRows, 3).setHorizontalAlignment('center');
  sheet.getRange(2, 4, numRows, 1).setHorizontalAlignment('left');
  range.setBorder(true, true, true, true, true, true, '#E5E1D6', SpreadsheetApp.BorderStyle.SOLID);
}

function readClasses_() {
  try {
    var classSheet = getOrCreateClassSheet_();
    var lastRow = classSheet.getLastRow();
    if (lastRow <= 1) return [];

    var values = classSheet.getRange(2, 1, lastRow - 1, 4).getValues();
    var list = [];
    for (var i = 0; i < values.length; i++) {
      var cName = (values[i][0] || '').toString().trim();
      if (!cName) continue;
      var siSo = parseInt(values[i][1], 10);
      var soDoanVien = parseInt(values[i][2], 10);
      var ghiChu = (values[i][3] || '').toString().trim();

      list.push({
        className: cName,
        siSo: isNaN(siSo) || siSo < 0 ? 0 : siSo,
        soDoanVien: isNaN(soDoanVien) || soDoanVien < 0 ? 0 : soDoanVien,
        ghiChu: ghiChu
      });
    }

    list.sort(function(a, b) {
      return a.className.localeCompare(b.className, undefined, { numeric: true, sensitivity: 'base' });
    });
    return list;
  } catch (e) {
    return [];
  }
}

// Chạy tay trong Apps Script editor hoặc từ trang Admin để trang trí lại TẤT CẢ các tab
function trangTriTatCaCacTuan() {
  checkConfigured_();
  var ssStudent = getStudentSpreadsheet_();
  var ssAdmin = getAdminSpreadsheet_();

  var mainSheet = getMainStudentSheet_(ssStudent);
  if (mainSheet) formatMainStudentSheet_(mainSheet);

  var configSheet = ssAdmin.getSheetByName('Config');
  if (configSheet) formatConfigSheet_(configSheet);

  var logSheet = ssAdmin.getSheetByName('Log');
  if (logSheet) formatLogSheet_(logSheet);

  var classSheet = ssAdmin.getSheetByName('DanhSachLop');
  if (classSheet) {
    formatClassSheet_(classSheet);
    formatClassSheetRows_(classSheet);
  }

  var sheets = ssStudent.getSheets();
  sheets.forEach(function (sheet) {
    var name = sheet.getName();
    if (name === 'Config' || name === 'DanhSachLop' || name === 'Log' || name === 'DanhSachHocSinh') return;
    ensureWeekSheetHeader_(sheet);
    formatWeekSheet_(sheet);
  });
}

function readWeeks_(configSheet) {
  var weeks = [];
  try {
    var a8 = (configSheet.getRange('A8').getValue() || '').toString().trim().toUpperCase();
    var b8 = (configSheet.getRange('B8').getValue() || '').toString().trim().toLowerCase();
    var isNewTable = (a8 === 'STT' || b8.indexOf('hoạt động') >= 0);

    if (isNewTable) {
      var row = 9;
      var sttCounter = 1;
      while (true) {
        var nameVal = configSheet.getRange('B' + row).getValue();
        if (!nameVal && nameVal !== 0) {
          var nextVal = configSheet.getRange('B' + (row + 1)).getValue();
          if (!nextVal) break;
        }
        var name = (nameVal || '').toString().trim();
        if (name) {
          var startVal = configSheet.getRange('C' + row).getValue();
          var endVal = configSheet.getRange('D' + row).getValue();
          var targetRaw = (configSheet.getRange('E' + row).getValue() || '').toString().trim().toLowerCase();
          var ghiChu = (configSheet.getRange('F' + row).getValue() || '').toString().trim();

          var startDate = formatCellDate_(startVal);
          var endDate = formatCellDate_(endVal);

          var isAll = (targetRaw === 'cả lớp' || targetRaw === 'toàn lớp' || targetRaw === 'all' || targetRaw === 'toan_lop');
          var targetType = isAll ? 'ALL' : 'UNION';
          var targetLabel = isAll ? 'Cả lớp' : 'Đoàn viên';

          weeks.push({
            stt: sttCounter++,
            name: name,
            startDate: startDate,
            endDate: endDate,
            targetType: targetType,
            targetLabel: targetLabel,
            ghiChu: ghiChu
          });
        }
        row++;
      }
    } else {
      // Đọc bảng cũ từ dòng 7
      var row = 7;
      var sttCounter = 1;
      while (true) {
        var val = configSheet.getRange('A' + row).getValue();
        if (!val) break;
        var name = val.toString().trim();
        if (name) {
          var targetRaw = (configSheet.getRange('B' + row).getValue() || '').toString().trim().toLowerCase();
          var startVal = configSheet.getRange('C' + row).getValue();
          var endVal = configSheet.getRange('D' + row).getValue();
          var isAll = (targetRaw === 'cả lớp' || targetRaw === 'toàn lớp' || targetRaw === 'all' || targetRaw === 'toan_lop');
          var targetType = isAll ? 'ALL' : 'UNION';
          var targetLabel = isAll ? 'Cả lớp' : 'Đoàn viên';

          weeks.push({
            stt: sttCounter++,
            name: name,
            startDate: formatCellDate_(startVal),
            endDate: formatCellDate_(endVal),
            targetType: targetType,
            targetLabel: targetLabel,
            ghiChu: ''
          });
        }
        row++;
      }
    }
  } catch (e) {
    // Trả về danh sách đã đọc
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
    var classes = readClasses_();
    var classList = classes.map(function(c) { return c.className; });

    var adminUrl = '?page=admin';
    try {
      var serviceUrl = ScriptApp.getService().getUrl();
      if (serviceUrl) {
        var base = serviceUrl.split('?')[0];
        adminUrl = base + '?page=admin';
      }
    } catch (e) {}

    var fallbackWeeks = [
      { name: 'Tuần 1', targetType: 'UNION', targetLabel: 'Đoàn viên' },
      { name: 'Tuần 2', targetType: 'UNION', targetLabel: 'Đoàn viên' },
      { name: 'Tuần 3', targetType: 'ALL', targetLabel: 'Cả lớp' },
      { name: 'Tuần 4', targetType: 'UNION', targetLabel: 'Đoàn viên' }
    ];

    var finalWeeks = weeks.length ? weeks : fallbackWeeks;

    return {
      tenTruong: tenTruong || 'Trường THPT Phan Việt Thống',
      tieuDe: tieuDe || 'Web Thu Hình Ảnh\nHoạt Động Đoàn',
      ghiChu: ghiChu || '',
      weeks: finalWeeks,
      weekNames: finalWeeks.map(function(w) { return w.name; }),
      classList: classList,
      adminUrl: adminUrl
    };
  } catch (err) {
    return {
      tenTruong: 'Trường THPT Phan Việt Thống',
      tieuDe: 'Web Thu Hình Ảnh\nHoạt Động Đoàn',
      ghiChu: 'Chưa cấu hình Sheet',
      weeks: [
        { name: 'Tuần 1', targetType: 'UNION', targetLabel: 'Đoàn viên' },
        { name: 'Tuần 2', targetType: 'UNION', targetLabel: 'Đoàn viên' },
        { name: 'Tuần 3', targetType: 'ALL', targetLabel: 'Cả lớp' },
        { name: 'Tuần 4', targetType: 'UNION', targetLabel: 'Đoàn viên' }
      ],
      weekNames: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'],
      classList: [],
      adminUrl: '?page=admin',
      error: err.message
    };
  }
}

// ============================================================
// TIỆN ÍCH SO SÁNH HỌC SINH & XÓA FILE DRIVE CŨ
// ============================================================

function normalizeClass_(c) {
  return (c || '').toString().toUpperCase().replace(/[\s\-_.]/g, '');
}

function normalizeStudentName_(n) {
  return (n || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function isSameStudent_(rowName, rowClass, rowStt, targetName, targetClass, targetStt) {
  if (normalizeClass_(rowClass) !== normalizeClass_(targetClass)) {
    return false;
  }
  var rStt = parseInt(rowStt, 10);
  var tStt = parseInt(targetStt, 10);
  if (!isNaN(rStt) && !isNaN(tStt) && rStt > 0 && tStt > 0) {
    return rStt === tStt;
  }
  return normalizeStudentName_(rowName) === normalizeStudentName_(targetName);
}

function extractDriveFileId_(url) {
  if (!url) return '';
  var str = url.toString();
  var m1 = str.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (m1) return m1[1];
  var m2 = str.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m2) return m2[1];
  return '';
}

function deleteDriveFileByUrl_(url) {
  if (!url) return false;
  try {
    var fileId = extractDriveFileId_(url);
    if (fileId) {
      DriveApp.getFileById(fileId).setTrashed(true);
      return true;
    }
  } catch (e) {
    console.warn('Lỗi khi xóa file cũ trên Drive (' + url + '): ' + e.toString());
  }
  return false;
}

// Kiểm tra số lần học sinh đã nộp cho 1 phong trào (tối đa 3 lần)
function checkStudentSubmissionStatus(fullName, className, stt, week) {
  try {
    if (!className || !week) {
      return { submitted: false, count: 0, maxCount: 3, canSubmitMore: true };
    }
    var ssStudent = getStudentSpreadsheet_();
    var sheetName = sanitizeSheetName_(week);
    var sheet = ssStudent.getSheetByName(sheetName) || ssStudent.getSheetByName(week);
    if (!sheet || sheet.getLastRow() <= 1) {
      return { submitted: false, count: 0, maxCount: 3, canSubmitMore: true };
    }

    var numRows = sheet.getLastRow() - 1;
    var lastCol = Math.max(sheet.getLastColumn(), 6);
    var data = sheet.getRange(2, 1, numRows, lastCol).getValues();
    var header = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var hasSttCol = (header[0] || '').toString().trim().toUpperCase() === 'STT';

    for (var r = 0; r < numRows; r++) {
      var rStt = hasSttCol ? data[r][0] : '';
      var rName = hasSttCol ? data[r][1] : data[r][1];
      var rClass = hasSttCol ? data[r][2] : data[r][2];

      if (isSameStudent_(rName, rClass, rStt, fullName, className, stt)) {
        var countVal = hasSttCol ? data[r][5] : data[r][4];
        var count = parseInt(countVal, 10);
        if (isNaN(count) || count <= 0) count = 1;
        var timeVal = (hasSttCol ? data[r][3] : data[r][0]) || '';
        if (timeVal instanceof Date) {
          timeVal = Utilities.formatDate(timeVal, "GMT+7", "dd/MM/yyyy HH:mm");
        }
        return {
          submitted: true,
          count: count,
          maxCount: 3,
          canSubmitMore: (count < 3),
          lastTime: timeVal.toString()
        };
      }
    }
    return { submitted: false, count: 0, maxCount: 3, canSubmitMore: true };
  } catch (e) {
    return { submitted: false, count: 0, maxCount: 3, canSubmitMore: true, error: e.toString() };
  }
}

function uploadFile(base64Data, fileName, fullName, className, week, stt) {
  if (!base64Data || !fileName || !fullName || !className || !week) {
    return "LỖI: Thiếu dữ liệu (họ tên / lớp / hoạt động / file).";
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
    var MAX_SUBMISSIONS = 3;
    var ssStudent = getStudentSpreadsheet_();

    // 0. KIỂM TRA SỐ LẦN ĐÃ NỘP TRƯỚC ĐÓ CỦA HỌC SINH TRONG HOẠT ĐỘNG NÀY
    var sheetName = sanitizeSheetName_(week);
    var weekSheet = ssStudent.getSheetByName(sheetName) || ssStudent.getSheetByName(week);
    var existingSubmitCount = 0;
    var matchedWeekRowIndices = []; // Lưu các số dòng (1-based) bị trùng để cập nhật / dọn dẹp
    var oldDriveUrls = [];

    if (weekSheet && weekSheet.getLastRow() > 1) {
      ensureWeekSheetHeader_(weekSheet);
      var wNumRows = weekSheet.getLastRow() - 1;
      var wLastCol = Math.max(weekSheet.getLastColumn(), 6);
      var wData = weekSheet.getRange(2, 1, wNumRows, wLastCol).getValues();
      var wHeader = weekSheet.getRange(1, 1, 1, wLastCol).getValues()[0];
      var hasSttCol = (wHeader[0] || '').toString().trim().toUpperCase() === 'STT';
      var richTextLinks = weekSheet.getRange(2, hasSttCol ? 5 : 4, wNumRows, 1).getRichTextValues();

      for (var r = 0; r < wNumRows; r++) {
        var rStt = hasSttCol ? wData[r][0] : '';
        var rName = hasSttCol ? wData[r][1] : wData[r][1];
        var rClass = hasSttCol ? wData[r][2] : wData[r][2];

        if (isSameStudent_(rName, rClass, rStt, fullName, className, sttNum)) {
          var rowNum = r + 2;
          matchedWeekRowIndices.push(rowNum);

          var countVal = hasSttCol ? wData[r][5] : wData[r][4];
          var parsedCount = parseInt(countVal, 10);
          if (!isNaN(parsedCount) && parsedCount > existingSubmitCount) {
            existingSubmitCount = parsedCount;
          }

          var fileUrl = '';
          if (richTextLinks[r] && richTextLinks[r][0] && richTextLinks[r][0].getLinkUrl()) {
            fileUrl = richTextLinks[r][0].getLinkUrl();
          } else {
            fileUrl = (hasSttCol ? wData[r][4] : wData[r][3]) || '';
          }
          if (fileUrl) {
            oldDriveUrls.push(fileUrl);
          }
        }
      }

      if (matchedWeekRowIndices.length > 0 && existingSubmitCount === 0) {
        existingSubmitCount = matchedWeekRowIndices.length;
      }
    }

    // NẾU ĐÃ NỘP ĐỦ 3 LẦN -> TỪ CHỐI NGAY LẬP TỨC (KHÔNG TẠO FILE MỚI TRÊN DRIVE)
    if (existingSubmitCount >= MAX_SUBMISSIONS) {
      return "LỖI: Học sinh " + fullName + " (" + className + (sttNum ? (', STT ' + sttNum) : '') + ") đã nộp tối đa " + MAX_SUBMISSIONS + " lần cho hoạt động này. Hệ thống không tiếp nhận thêm!";
    }

    var newSubmitCount = (existingSubmitCount > 0) ? (existingSubmitCount + 1) : 1;

    // 1. MỞ THƯ MỤC DRIVE ĐỂ LƯU FILE MỚI
    var mainFolder;
    try {
      mainFolder = DriveApp.getFolderById(MAIN_FOLDER_ID);
    } catch (e) {
      return "LỖI (Bước mở Drive): " + e.toString();
    }

    var weekFolderName = sanitizeForFileName_(week, 45);
    var weekFolder;
    try {
      var folders = mainFolder.getFoldersByName(weekFolderName);
      weekFolder = folders.hasNext() ? folders.next() : mainFolder.createFolder(weekFolderName);
    } catch (e) {
      return "LỖI (Bước tạo thư mục hoạt động): " + e.toString();
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
    var splitBase = base64Data.split(',');
    if (splitBase.length < 2) {
      return "LỖI: Dữ liệu file gửi lên không hợp lệ.";
    }
    var type = splitBase[0].split(';')[0].replace('data:', '');
    var byteCharacters = Utilities.base64Decode(splitBase[1]);

    // Tên file mới: Lop_STTxx_HoTen_LanX_HoatDong_ThoiGian.duoi
    var dotIndex = fileName.lastIndexOf('.');
    var ext = dotIndex !== -1 ? fileName.substring(dotIndex + 1) : '';
    var timestampForName = Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd_HHmmss");
    var sttPrefix = sttNum !== '' ? ('STT' + (sttNum < 10 ? '0' + sttNum : sttNum) + '_') : '';
    var lanPrefix = 'Lan' + newSubmitCount + '_';
    var newFileName = sanitizeForFileName_(className) + '_' +
                       sttPrefix +
                       sanitizeForFileName_(fullName) + '_' +
                       lanPrefix +
                       sanitizeForFileName_(week, 35) + '_' +
                       timestampForName + (ext ? ('.' + ext) : '');

    var blob = Utilities.newBlob(byteCharacters, type, newFileName);
    mainFile = targetFolder.createFile(blob);
    mainFileUrl = mainFile.getUrl();

    // 2. TỰ ĐỘNG XÓA FILE CŨ TRÊN GOOGLE DRIVE (KHI NỘP LẦN 2, 3)
    if (oldDriveUrls.length > 0) {
      for (var u = 0; u < oldDriveUrls.length; u++) {
        deleteDriveFileByUrl_(oldDriveUrls[u]);
      }
    }

    // 3. GHI / CẬP NHẬT VÀO SHEET HOẠT ĐỘNG CỤ THỂ
    var timestamp = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");
    if (!weekSheet) {
      weekSheet = ssStudent.insertSheet(sheetName);
      weekSheet.appendRow(["STT", "Họ và tên", "Lớp", "Thời gian", "Link ảnh", "Lần nộp"]);
      formatWeekSheet_(weekSheet);
    } else {
      ensureWeekSheetHeader_(weekSheet);
    }

    var targetWeekRow = -1;
    if (matchedWeekRowIndices.length > 0) {
      // Cập nhật đè lên dòng đầu tiên tìm thấy
      targetWeekRow = matchedWeekRowIndices[0];
      weekSheet.getRange(targetWeekRow, 1, 1, 6).setValues([[
        sttNum,
        fullName,
        className,
        timestamp,
        mainFileUrl,
        newSubmitCount
      ]]);

      // Nếu trước đó có các dòng trùng thừa khác, xóa từ dưới lên để không làm xáo trộn chỉ số dòng
      if (matchedWeekRowIndices.length > 1) {
        for (var d = matchedWeekRowIndices.length - 1; d >= 1; d--) {
          try {
            weekSheet.deleteRow(matchedWeekRowIndices[d]);
          } catch (eDel) {}
        }
      }
    } else {
      // Thêm dòng mới nếu chưa từng nộp
      weekSheet.appendRow([sttNum, fullName, className, timestamp, mainFileUrl, newSubmitCount]);
      targetWeekRow = weekSheet.getLastRow();
    }

    var linkLabel = (newSubmitCount > 1) ? ("Xem ảnh (Lần " + newSubmitCount + ")") : "Xem ảnh";
    var linkValue = SpreadsheetApp.newRichTextValue()
      .setText(linkLabel)
      .setLinkUrl(mainFileUrl)
      .build();
    weekSheet.getRange(targetWeekRow, 5).setRichTextValue(linkValue);

    // Tự động sắp xếp sheet hoạt động theo Lớp và STT
    var currentLastRow = weekSheet.getLastRow();
    if (currentLastRow >= 3) {
      var numDataRows = currentLastRow - 1;
      var dataRange = weekSheet.getRange(2, 1, numDataRows, 6);
      dataRange.sort([
        { column: 3, ascending: true }, // Cột Lớp
        { column: 1, ascending: true }  // Cột STT từ nhỏ đến lớn
      ]);
    }

    // 4. GHI / CẬP NHẬT VÀO SHEET CHÍNH (DanhSachHocSinh)
    try {
      var mainSheet = getMainStudentSheet_(ssStudent);
      ensureMainStudentSheetHeader_(mainSheet);
      var mNumRows = mainSheet.getLastRow() - 1;
      var matchedMainRow = -1;

      if (mNumRows > 0) {
        var mData = mainSheet.getRange(2, 1, mNumRows, 8).getValues();
        for (var mr = 0; mr < mNumRows; mr++) {
          var mClass = mData[mr][1];
          var mStt = mData[mr][2];
          var mName = mData[mr][3];
          var mWeek = mData[mr][4];
          if (mWeek === week && isSameStudent_(mName, mClass, mStt, fullName, className, sttNum)) {
            matchedMainRow = mr + 2;
            break;
          }
        }
      }

      if (matchedMainRow > 0) {
        // Cập nhật dòng đã có trong DanhSachHocSinh
        mainSheet.getRange(matchedMainRow, 2, 1, 7).setValues([[
          className,
          sttNum,
          fullName,
          week,
          timestamp,
          mainFileUrl,
          newSubmitCount
        ]]);
        var mainLinkVal = SpreadsheetApp.newRichTextValue()
          .setText(linkLabel)
          .setLinkUrl(mainFileUrl)
          .build();
        mainSheet.getRange(matchedMainRow, 7).setRichTextValue(mainLinkVal);
      } else {
        // Thêm dòng mới
        var nextOverallStt = Math.max(1, mainSheet.getLastRow());
        mainSheet.appendRow([nextOverallStt, className, sttNum, fullName, week, timestamp, mainFileUrl, newSubmitCount]);
        var newMainRow = mainSheet.getLastRow();
        var mainLinkVal = SpreadsheetApp.newRichTextValue()
          .setText(linkLabel)
          .setLinkUrl(mainFileUrl)
          .build();
        mainSheet.getRange(newMainRow, 7).setRichTextValue(mainLinkVal);
      }

      // Sắp xếp lại DanhSachHocSinh theo Lớp và STT Lớp, rồi đánh lại STT tổng 1..N
      var finalMainLastRow = mainSheet.getLastRow();
      if (finalMainLastRow >= 3) {
        var mainTotalDataRows = finalMainLastRow - 1;
        var mainDataRange = mainSheet.getRange(2, 1, mainTotalDataRows, 8);
        mainDataRange.sort([
          { column: 2, ascending: true }, // Cột Lớp
          { column: 3, ascending: true }  // Cột STT Lớp
        ]);
        var sttList = [];
        for (var sIdx = 1; sIdx <= mainTotalDataRows; sIdx++) {
          sttList.push([sIdx]);
        }
        mainSheet.getRange(2, 1, mainTotalDataRows, 1).setValues(sttList);
      }
    } catch (eMain) {
      console.warn("Lỗi ghi DanhSachHocSinh: " + eMain.toString());
    }

    // 5. GHI LOG KIỂM TOÁN VÀO SHEET LOG (BẢNG QUẢN TRỊ)
    var actorStr = (sttNum ? ('STT ' + sttNum + ' - ') : '') + fullName;
    if (newSubmitCount > 1) {
      writeLog_(null, 'Nộp lại minh chứng (Lần ' + newSubmitCount + '/3 - Đã xóa file cũ)', actorStr, className, week, 'Thay thế file cũ bằng: ' + newFileName, mainFileUrl, 'Thành công');
    } else {
      writeLog_(null, 'Nộp ảnh minh chứng (Lần 1/3)', actorStr, className, week, newFileName, mainFileUrl, 'Thành công');
    }

    return {
      success: true,
      url: mainFileUrl,
      fileUrl: mainFileUrl,
      count: newSubmitCount,
      maxCount: MAX_SUBMISSIONS,
      isReplacement: (newSubmitCount > 1),
      message: (newSubmitCount > 1)
        ? ('Nộp lại thành công (Lần nộp ' + newSubmitCount + '/' + MAX_SUBMISSIONS + '). Hệ thống đã tự động thay thế và xóa minh chứng cũ trên Google Drive.')
        : ('Nộp minh chứng thành công (Lần 1/' + MAX_SUBMISSIONS + ')!')
    };

  } catch (error) {
    return "LỖI (không xác định): " + error.toString() + " | Stack: " + error.stack;
  } finally {
    lock.releaseLock();
  }
}

// Học sinh báo cáo lý do không thực hiện được hoạt động
function submitNonCompletionReport(fullName, className, stt, week, reason) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (e) {
    return { success: false, message: 'Hệ thống đang bận xử lý, vui lòng thử lại sau vài giây!' };
  }

  try {
    fullName = (fullName || '').toString().trim();
    className = (className || '').toString().trim();
    week = (week || '').toString().trim();
    reason = (reason || '').toString().trim();
    var sttNum = parseInt(stt, 10);
    if (isNaN(sttNum) || sttNum <= 0) sttNum = '';

    if (!fullName) return { success: false, message: 'Vui lòng nhập họ và tên của bạn!' };
    if (!className) return { success: false, message: 'Vui lòng chọn hoặc nhập lớp của bạn!' };
    if (!week) return { success: false, message: 'Vui lòng chọn hoạt động / phong trào cần báo cáo!' };
    if (!reason || reason.length < 5) return { success: false, message: 'Vui lòng nhập lý do cụ thể (tối thiểu 5 ký tự) để nhà trường ghi nhận!' };

    checkConfigured_();
    var ssStudent = getStudentSpreadsheet_();
    var sheet = getOrCreateNonCompletionSheet_(ssStudent);
    var timestamp = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");

    var lastRow = sheet.getLastRow();
    var existingRowIndex = -1;

    if (lastRow >= 2) {
      var values = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
      for (var i = 0; i < values.length; i++) {
        var rowClass = values[i][2];
        var rowStt = values[i][3];
        var rowName = values[i][4];
        var rowWeek = values[i][5];

        if (rowWeek === week && isSameStudent_(rowName, rowClass, rowStt, fullName, className, sttNum)) {
          existingRowIndex = i + 2;
          break;
        }
      }
    }

    var isUpdate = false;
    if (existingRowIndex > 0) {
      isUpdate = true;
      sheet.getRange(existingRowIndex, 2).setValue(timestamp);
      sheet.getRange(existingRowIndex, 3).setValue(className);
      sheet.getRange(existingRowIndex, 4).setValue(sttNum !== '' ? sttNum : '');
      sheet.getRange(existingRowIndex, 5).setValue(fullName);
      sheet.getRange(existingRowIndex, 7).setValue(reason);
      sheet.getRange(existingRowIndex, 8).setValue('Đã cập nhật lý do');
    } else {
      var newStt = Math.max(1, lastRow);
      sheet.appendRow([
        newStt,
        timestamp,
        className,
        sttNum !== '' ? sttNum : '',
        fullName,
        week,
        reason,
        'Chờ xác nhận'
      ]);
    }

    var updatedLastRow = sheet.getLastRow();
    if (updatedLastRow >= 2) {
      var numRows = updatedLastRow - 1;
      var dataRange = sheet.getRange(2, 1, numRows, 8);
      dataRange.sort([
        { column: 3, ascending: true },
        { column: 4, ascending: true }
      ]);

      var sttCol = [];
      for (var s = 1; s <= numRows; s++) {
        sttCol.push([s]);
      }
      sheet.getRange(2, 1, numRows, 1).setValues(sttCol);
      formatNonCompletionSheet_(sheet);
    }

    try {
      writeLog_(
        null,
        isUpdate ? 'Cập nhật lý do không tham gia' : 'Báo không tham gia',
        fullName + (sttNum ? ' (STT ' + sttNum + ')' : ''),
        className,
        week,
        'Lý do: ' + reason,
        '',
        'Thành công'
      );
    } catch (eLog) {}

    return {
      success: true,
      isUpdate: isUpdate,
      message: isUpdate
        ? 'Đã cập nhật lại lý do không thể tham gia của bạn thành công!'
        : 'Đã ghi nhận thông báo lý do không thể tham gia của bạn. Nhà trường và GVCN sẽ xem xét!'
    };
  } catch (err) {
    return { success: false, message: 'Lỗi ghi nhận: ' + err.toString() };
  } finally {
    try {
      lock.releaseLock();
    } catch (e) {}
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
        spreadsheetUrl: getStudentSpreadsheetUrl_(),
        adminSpreadsheetUrl: getAdminSpreadsheetUrl_(),
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
    var ssStudent = getStudentSpreadsheet_();
    var ssAdmin = getAdminSpreadsheet_();

    var tenTruong = configSheet.getRange('B2').getValue();
    var tieuDe = configSheet.getRange('B3').getValue();
    var ghiChu = configSheet.getRange('B4').getValue();
    var subfolderByClass = getSubfolderByClassSetting_(configSheet);
    var weeks = readWeeks_(configSheet);
    var classes = readClasses_();

    var formUrl = '';
    var adminUrl = '?page=admin';
    try {
      var serviceUrl = ScriptApp.getService().getUrl();
      if (serviceUrl) {
        formUrl = serviceUrl.split('?')[0];
        adminUrl = formUrl + '?page=admin';
      }
    } catch (e) {}

    // Đếm số lượng nộp bài của từng tuần và gắn loại yêu cầu (trên bảng tính Học sinh)
    var weekStats = weeks.map(function(w) {
      var wName = typeof w === 'object' ? w.name : w;
      var wTargetType = typeof w === 'object' ? w.targetType : 'UNION';
      var wTargetLabel = typeof w === 'object' ? w.targetLabel : 'Đoàn viên';
      var wStartDate = typeof w === 'object' ? (w.startDate || '') : '';
      var wEndDate = typeof w === 'object' ? (w.endDate || '') : '';
      var wGhiChu = typeof w === 'object' ? (w.ghiChu || '') : '';
      var wStt = typeof w === 'object' ? (w.stt || '') : '';
      var sheet = ssStudent.getSheetByName(sanitizeSheetName_(wName)) || ssStudent.getSheetByName(wName);
      var count = 0;
      if (sheet) {
        var lastRow = sheet.getLastRow();
        count = Math.max(0, lastRow - 1);
      }
      return {
        stt: wStt,
        name: wName,
        startDate: wStartDate,
        endDate: wEndDate,
        ghiChu: wGhiChu,
        targetType: wTargetType,
        targetLabel: wTargetLabel,
        count: count,
        sheetExists: !!sheet
      };
    });

    var mainSheet = ssStudent.getSheetByName('DanhSachHocSinh');
    var mainStudentCount = 0;
    if (mainSheet && mainSheet.getLastRow() > 1) {
      mainStudentCount = mainSheet.getLastRow() - 1;
    }

    var logSheet = ssAdmin.getSheetByName('Log');
    var logCount = 0;
    if (logSheet && logSheet.getLastRow() > 1) {
      logCount = logSheet.getLastRow() - 1;
    }

    var nonCompSheet = ssStudent.getSheetByName('BaoKhongThucHien');
    var nonCompletionCount = 0;
    if (nonCompSheet && nonCompSheet.getLastRow() > 1) {
      nonCompletionCount = nonCompSheet.getLastRow() - 1;
    }

    return {
      success: true,
      config: {
        tenTruong: tenTruong || 'Trường THPT Phan Việt Thống',
        tieuDe: tieuDe || 'Web Thu Hình Ảnh\nHoạt Động Đoàn',
        ghiChu: ghiChu || '',
        subfolderByClass: subfolderByClass,
        weeks: weeks
      },
      classes: classes,
      weekStats: weekStats,
      mainStudentCount: mainStudentCount,
      logCount: logCount,
      nonCompletionCount: nonCompletionCount,
      formUrl: formUrl || '',
      adminUrl: adminUrl || '?page=admin',
      spreadsheetUrl: getStudentSpreadsheetUrl_(),
      adminSpreadsheetUrl: getAdminSpreadsheetUrl_(),
      driveFolderUrl: 'https://drive.google.com/drive/folders/' + MAIN_FOLDER_ID
    };
  } catch (err) {
    return { success: false, message: 'Lỗi nạp dữ liệu quản trị: ' + err.toString() };
  }
}

// Tính toán tiến độ phong trào của 1 tuần (dùng chung cho cả Admin và Form học sinh)
function computeWeekProgress_(weekName, ss, classes) {
  if (!ss) ss = getStudentSpreadsheet_();
  if (!classes) classes = readClasses_();

  // Xác định loại yêu cầu của tuần này (UNION hay ALL)
  var currentWeekObj = null;
  var weeks = [];
  try {
    var configSheet = getOrCreateConfigSheet_();
    weeks = readWeeks_(configSheet);
    for (var wIdx = 0; wIdx < weeks.length; wIdx++) {
      if (weeks[wIdx].name === weekName) {
        currentWeekObj = weeks[wIdx];
        break;
      }
    }
  } catch (e) {}

  var targetType = currentWeekObj ? currentWeekObj.targetType : 'UNION';
  var targetLabel = currentWeekObj ? currentWeekObj.targetLabel : 'Đoàn viên';
  var startDate = currentWeekObj ? (currentWeekObj.startDate || '') : '';
  var endDate = currentWeekObj ? (currentWeekObj.endDate || '') : '';
  var activityNotes = currentWeekObj ? (currentWeekObj.ghiChu || '') : '';

  var sheet = ss.getSheetByName(sanitizeSheetName_(weekName)) || ss.getSheetByName(weekName);
  var classStats = {};
  var totalRawSubmissions = 0;

  if (sheet) {
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      var numRows = lastRow - 1;
      var lastCol = Math.max(sheet.getLastColumn(), 5);
      var headerValues = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
      var hasSttCol = (headerValues[0] || '').toString().trim().toUpperCase() === 'STT';
      var classCol = hasSttCol ? 3 : 2; // Cột Lớp trong Sheet (1-based)
      var classValues = sheet.getRange(2, classCol, numRows, 1).getValues();

      for (var r = 0; r < numRows; r++) {
        var cVal = (classValues[r][0] || '').toString().trim();
        if (cVal) {
          classStats[cVal] = (classStats[cVal] || 0) + 1;
          totalRawSubmissions++;
        }
      }
    }
  }

  // Tính toán tiến độ chi tiết từng lớp theo yêu cầu của phong trào
  var classProgress = [];
  var totalSubmitted = 0;
  var totalTarget = 0;
  var completedClasses = 0;
  var totalMissingStudents = 0;
  var knownClassesMap = {};

  for (var c = 0; c < classes.length; c++) {
    var cls = classes[c];
    knownClassesMap[cls.className] = true;
    var submitted = classStats[cls.className] || 0;
    var target = targetType === 'ALL' ? cls.siSo : cls.soDoanVien;
    var missing = Math.max(0, target - submitted);
    var percent = target > 0 ? Math.round((submitted / target) * 100) : (submitted > 0 ? 100 : 0);
    var status = 'NOT_STARTED';
    if (submitted > target) status = 'EXCEEDED';
    else if (submitted === target && target > 0) status = 'COMPLETED';
    else if (submitted > 0) status = 'IN_PROGRESS';

    if (submitted >= target && target > 0) completedClasses++;
    totalSubmitted += submitted;
    totalTarget += target;
    totalMissingStudents += missing;

    classProgress.push({
      className: cls.className,
      siSo: cls.siSo,
      soDoanVien: cls.soDoanVien,
      targetCount: target,
      submittedCount: submitted,
      missingCount: missing,
      percentage: percent,
      status: status,
      ghiChu: cls.ghiChu || ''
    });
  }

  // Các lớp chưa có trong DanhSachLop nhưng có học sinh nộp bài
  Object.keys(classStats).forEach(function(cName) {
    if (!knownClassesMap[cName]) {
      var subCount = classStats[cName];
      totalSubmitted += subCount;
      classProgress.push({
        className: cName,
        siSo: 0,
        soDoanVien: 0,
        targetCount: 0,
        submittedCount: subCount,
        missingCount: 0,
        percentage: 100,
        status: 'UNLISTED',
        ghiChu: 'Chưa có trong danh mục lớp'
      });
    }
  });

  classProgress.sort(function(a, b) {
    return a.className.localeCompare(b.className, undefined, { numeric: true, sensitivity: 'base' });
  });

  var overallPercentage = totalTarget > 0 ? Math.round((totalSubmitted / totalTarget) * 100) : (totalSubmitted > 0 ? 100 : 0);

  var progressSummary = {
    targetType: targetType,
    targetLabel: targetLabel,
    totalSubmitted: totalSubmitted,
    totalTarget: totalTarget,
    overallPercentage: overallPercentage,
    totalClasses: classes.length,
    completedClasses: completedClasses,
    totalMissingStudents: totalMissingStudents
  };

  return {
    weekName: weekName,
    startDate: startDate,
    endDate: endDate,
    activityNotes: activityNotes,
    weeks: weeks,
    targetType: targetType,
    targetLabel: targetLabel,
    classStats: classStats,
    totalRawSubmissions: totalRawSubmissions,
    classProgress: classProgress,
    progressSummary: progressSummary
  };
}

// Xem tiến độ các lớp công khai (dành cho học sinh, phụ huynh, GVCN xem tại Index.html - KHÔNG yêu cầu mật khẩu)
function getPublicProgress(weekName) {
  try {
    checkConfigured_();
    var ssStudent = getStudentSpreadsheet_();
    var configSheet = getOrCreateConfigSheet_();
    var weeks = readWeeks_(configSheet);

    if (!weekName) {
      weekName = weeks.length > 0 ? weeks[0].name : 'Tuần 1';
    }

    var classes = readClasses_();
    var progress = computeWeekProgress_(weekName, ssStudent, classes);

    return {
      success: true,
      weekName: weekName,
      startDate: progress.startDate || '',
      endDate: progress.endDate || '',
      activityNotes: progress.activityNotes || '',
      weeks: progress.weeks || weeks,
      targetType: progress.targetType,
      targetLabel: progress.targetLabel,
      classProgress: progress.classProgress,
      progressSummary: progress.progressSummary
    };
  } catch (err) {
    return { success: false, message: 'Lỗi tải tiến độ: ' + err.toString() };
  }
}

// Lấy danh sách bài nộp chi tiết của 1 tuần kèm thống kê tiến độ phong trào (Trang Admin)
function getAdminSubmissions(password, weekName) {
  var auth = verifyAdminPassword(password);
  if (!auth.success) return auth;

  try {
    checkConfigured_();
    var ssStudent = getStudentSpreadsheet_();
    var sheet = ssStudent.getSheetByName(sanitizeSheetName_(weekName)) || ssStudent.getSheetByName(weekName);
    var classes = readClasses_();
    var progress = computeWeekProgress_(weekName, ssStudent, classes);

    var submissions = [];
    if (sheet) {
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        var numRows = lastRow - 1;
        var lastCol = Math.max(sheet.getLastColumn(), 6);
        var values = sheet.getRange(2, 1, numRows, lastCol).getValues();
        var headerValues = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        var hasSttCol = (headerValues[0] || '').toString().trim().toUpperCase() === 'STT';

        var richTexts = hasSttCol
          ? sheet.getRange(2, 5, numRows, 1).getRichTextValues()
          : sheet.getRange(2, 4, numRows, 1).getRichTextValues();

        for (var i = 0; i < numRows; i++) {
          var rowNumber = i + 2; // Số dòng thực tế trong Sheet (1-based)
          var sttVal = '';
          var nameVal = '';
          var classVal = '';
          var timeVal = '';
          var linkVal = '';
          var submitCountVal = 1;

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
            if (values[i].length >= 6 && values[i][5]) {
              var parsedC = parseInt(values[i][5], 10);
              if (!isNaN(parsedC) && parsedC > 0) submitCountVal = parsedC;
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
            if (values[i].length >= 5 && values[i][4]) {
              var parsedOldC = parseInt(values[i][4], 10);
              if (!isNaN(parsedOldC) && parsedOldC > 0) submitCountVal = parsedOldC;
            }
          }

          if (timeVal instanceof Date) {
            timeVal = Utilities.formatDate(timeVal, "GMT+7", "dd/MM/yyyy HH:mm:ss");
          } else {
            timeVal = (timeVal || '').toString();
          }

          submissions.push({
            rowIndex: rowNumber,
            stt: sttVal,
            timestamp: timeVal,
            fullName: nameVal,
            className: classVal,
            fileUrl: linkVal,
            submitCount: submitCountVal
          });
        }

        // Sắp xếp tự động từ trên xuống theo Lớp và STT
        submissions.sort(function(a, b) {
          var clsA = (a.className || '').toString();
          var clsB = (b.className || '').toString();
          if (clsA !== clsB) return clsA.localeCompare(clsB, undefined, { numeric: true, sensitivity: 'base' });

          var sA = parseInt(a.stt, 10);
          var sB = parseInt(b.stt, 10);
          if (!isNaN(sA) && !isNaN(sB)) return sA - sB;
          if (!isNaN(sA)) return -1;
          if (!isNaN(sB)) return 1;
          return (a.fullName || '').localeCompare(b.fullName || '');
        });
      }
    }

    return {
      success: true,
      weekName: weekName,
      startDate: progress.startDate || '',
      endDate: progress.endDate || '',
      activityNotes: progress.activityNotes || '',
      targetType: progress.targetType,
      targetLabel: progress.targetLabel,
      submissions: submissions,
      classProgress: progress.classProgress,
      progressSummary: progress.progressSummary,
      stats: {
        total: submissions.length,
        classStats: progress.classStats
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
      var isSub = !!newConfig.subfolderByClass;
      configSheet.getRange('D1').setValue(isSub);
      configSheet.getRange('D2').setValue(isSub);
    }

    if (newConfig.weeks && Array.isArray(newConfig.weeks)) {
      var maxRows = configSheet.getMaxRows();
      if (maxRows >= 9) {
        configSheet.getRange(9, 1, maxRows - 8, 6).clearContent();
      } else if (maxRows >= 7) {
        configSheet.getRange(7, 1, maxRows - 6, 2).clearContent();
      }

      var filteredWeeks = newConfig.weeks.filter(function(w) {
        if (!w) return false;
        var name = typeof w === 'object' ? w.name : w;
        return !!(name && name.toString().trim());
      });

      if (filteredWeeks.length > 0) {
        var weekValues = filteredWeeks.map(function(w, idx) {
          var name = (typeof w === 'object' ? (w.name || '') : w).toString().trim();
          var stt = (typeof w === 'object' && w.stt) ? w.stt : (idx + 1);
          var startDate = typeof w === 'object' ? (w.startDate || '') : '';
          var endDate = typeof w === 'object' ? (w.endDate || '') : '';
          var isAll = typeof w === 'object' && (w.targetType === 'ALL' || w.targetLabel === 'Cả lớp');
          var targetLabel = isAll ? 'Cả lớp' : 'Đoàn viên';
          var ghiChu = typeof w === 'object' ? (w.ghiChu || '') : '';
          return [stt, name, startDate, endDate, targetLabel, ghiChu];
        });
        configSheet.getRange(9, 1, weekValues.length, 6).setValues(weekValues);
      }
      formatConfigSheet_(configSheet);
    }

    try {
      writeLog_(null, 'Cập nhật cấu hình', 'Admin', '', '', 'Lưu cấu hình thông tin trường & danh sách phong trào', '', 'Thành công');
    } catch (eLog) {}

    return { success: true, message: 'Đã lưu cấu hình thành công!' };
  } catch (err) {
    return { success: false, message: 'Lỗi lưu cấu hình: ' + err.toString() };
  }
}

// Bật / Tắt nhanh tính năng tạo thư mục con theo lớp
function adminToggleSubfolderByClass(password, enabled) {
  var auth = verifyAdminPassword(password);
  if (!auth.success) return auth;

  try {
    var configSheet = getOrCreateConfigSheet_();
    var isEnabled = !!enabled;
    configSheet.getRange('D1').setValue(isEnabled);
    configSheet.getRange('D2').setValue(isEnabled);

    try {
      writeLog_(
        null,
        'Cập nhật cấu hình',
        'Admin',
        '',
        '',
        (isEnabled ? 'BẬT' : 'TẮT') + ' tính năng tự động tạo thư mục con theo Lớp trên Google Drive',
        '',
        'Thành công'
      );
    } catch (eLog) {}

    return {
      success: true,
      enabled: isEnabled,
      message: isEnabled
        ? 'Đã BẬT: Các bài nộp mới sẽ tự động lưu vào thư mục con theo từng Lớp.'
        : 'Đã TẮT: Các bài nộp mới sẽ lưu trực tiếp trong thư mục của từng Tuần.'
    };
  } catch (err) {
    return { success: false, message: 'Lỗi cập nhật cài đặt: ' + err.toString() };
  }
}

// Khởi tạo trước toàn bộ thư mục con của các lớp trên Google Drive
function adminCreateAllClassSubfolders(password) {
  var auth = verifyAdminPassword(password);
  if (!auth.success) return auth;

  try {
    checkConfigured_();
    var mainFolder = DriveApp.getFolderById(MAIN_FOLDER_ID);
    var configSheet = getOrCreateConfigSheet_();
    var weeks = readWeeks_(configSheet);
    var classes = readClasses_();

    if (!weeks || weeks.length === 0) {
      return { success: false, message: 'Chưa có hoạt động / tuần nào trong danh sách cấu hình!' };
    }
    if (!classes || classes.length === 0) {
      return { success: false, message: 'Chưa có danh sách lớp nào trong hệ thống! Vui lòng thêm lớp tại tab Quản lý Lớp trước.' };
    }

    // Đảm bảo bật setting trên Sheet
    configSheet.getRange('D1').setValue(true);
    configSheet.getRange('D2').setValue(true);

    var createdCount = 0;
    var existingCount = 0;

    weeks.forEach(function(w) {
      var wName = typeof w === 'object' ? w.name : w;
      if (!wName) return;
      var weekFolderName = sanitizeForFileName_(wName, 45);
      var wFolders = mainFolder.getFoldersByName(weekFolderName);
      var weekFolder = wFolders.hasNext() ? wFolders.next() : mainFolder.createFolder(weekFolderName);

      classes.forEach(function(c) {
        var clsName = (typeof c === 'object' ? c.className : c).toString().trim();
        if (!clsName) return;

        var cFolders = weekFolder.getFoldersByName(clsName);
        if (cFolders.hasNext()) {
          existingCount++;
        } else {
          weekFolder.createFolder(clsName);
          createdCount++;
        }
      });
    });

    try {
      writeLog_(
        null,
        'Khởi tạo thư mục Drive',
        'Admin',
        '',
        '',
        'Đã tạo mới ' + createdCount + ' thư mục lớp, đồng bộ ' + (createdCount + existingCount) + ' thư mục trên Google Drive',
        '',
        'Thành công'
      );
    } catch (eLog) {}

    return {
      success: true,
      createdCount: createdCount,
      totalCount: createdCount + existingCount,
      driveUrl: 'https://drive.google.com/drive/folders/' + MAIN_FOLDER_ID,
      message: 'Khởi tạo thành công! Đã tạo mới ' + createdCount + ' thư mục lớp (tổng số: ' + (createdCount + existingCount) + ' thư mục sẵn sàng trên Drive).'
    };
  } catch (err) {
    return { success: false, message: 'Lỗi khởi tạo thư mục trên Drive: ' + err.toString() };
  }
}

// Lưu danh sách lớp học (Sĩ số, Số đoàn viên, Ghi chú)
function adminSaveClasses(password, classes) {
  var auth = verifyAdminPassword(password);
  if (!auth.success) return auth;

  try {
    var classSheet = getOrCreateClassSheet_();
    var maxRows = classSheet.getMaxRows();
    if (maxRows >= 2) {
      classSheet.getRange(2, 1, maxRows - 1, 4).clearContent();
    }

    if (Array.isArray(classes) && classes.length > 0) {
      var rows = [];
      for (var i = 0; i < classes.length; i++) {
        var c = classes[i];
        var name = (c.className || '').toString().trim();
        if (!name) continue;
        var siSo = parseInt(c.siSo, 10);
        var soDoanVien = parseInt(c.soDoanVien, 10);
        var ghiChu = (c.ghiChu || '').toString().trim();
        rows.push([
          name,
          isNaN(siSo) || siSo < 0 ? 0 : siSo,
          isNaN(soDoanVien) || soDoanVien < 0 ? 0 : soDoanVien,
          ghiChu
        ]);
      }
      if (rows.length > 0) {
        rows.sort(function(a, b) {
          return a[0].localeCompare(b[0], undefined, { numeric: true, sensitivity: 'base' });
        });
        classSheet.getRange(2, 1, rows.length, 4).setValues(rows);
        formatClassSheetRows_(classSheet);
      }
    }

    try {
      writeLog_(null, 'Cập nhật danh sách lớp', 'Admin', '', '', 'Lưu thông tin sĩ số và đoàn viên (' + (classes ? classes.length : 0) + ' lớp)', '', 'Thành công');
    } catch (eLog2) {}

    return { success: true, message: 'Đã lưu danh sách lớp thành công!', classes: readClasses_() };
  } catch (err) {
    return { success: false, message: 'Lỗi lưu danh sách lớp: ' + err.toString() };
  }
}

// Nhập nhanh danh sách lớp từ văn bản dán vào (hỗ trợ copy từ Excel/Word/txt)
function adminImportClassesText(password, text) {
  var auth = verifyAdminPassword(password);
  if (!auth.success) return auth;

  if (!text || !text.trim()) {
    return { success: false, message: 'Nội dung dán vào đang trống!' };
  }

  try {
    var lines = text.split(/\r?\n/);
    var classes = [];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;
      var parts = line.split(/[\t,;]+/).map(function(s) { return s.trim(); }).filter(Boolean);
      if (parts.length === 1) {
        parts = line.split(/\s+/).map(function(s) { return s.trim(); }).filter(Boolean);
      }
      if (parts.length >= 1) {
        var className = parts[0];
        if (className.toLowerCase() === 'lớp' || className.toLowerCase() === 'class') continue;
        var siSo = parts.length >= 2 ? parseInt(parts[1], 10) : 0;
        var soDoanVien = parts.length >= 3 ? parseInt(parts[2], 10) : (siSo > 0 ? siSo : 0);
        var ghiChu = parts.length >= 4 ? parts.slice(3).join(' ') : '';
        classes.push({
          className: className,
          siSo: isNaN(siSo) ? 0 : siSo,
          soDoanVien: isNaN(soDoanVien) ? 0 : soDoanVien,
          ghiChu: ghiChu
        });
      }
    }

    if (classes.length === 0) {
      return { success: false, message: 'Không tìm thấy dòng thông tin lớp hợp lệ.' };
    }

    return adminSaveClasses(password, classes);
  } catch (err) {
    return { success: false, message: 'Lỗi xử lý văn bản: ' + err.toString() };
  }
}

// Chuyển đổi nhanh loại yêu cầu của 1 tuần (Cả lớp hoặc Đoàn viên)
function adminSetWeekTargetType(password, weekName, targetType) {
  var auth = verifyAdminPassword(password);
  if (!auth.success) return auth;

  try {
    var configSheet = getOrCreateConfigSheet_();
    var lastRow = configSheet.getLastRow();
    var found = false;
    var isAll = (targetType === 'ALL' || targetType === 'Cả lớp');
    var targetLabel = isAll ? 'Cả lớp' : 'Đoàn viên';

    // Thử tìm trong bảng cấu hình mới 6 cột (từ dòng 9, tên ở cột B, chỉ tiêu ở cột E)
    if (lastRow >= 9) {
      for (var r = 9; r <= lastRow; r++) {
        var val = (configSheet.getRange('B' + r).getValue() || '').toString().trim();
        if (val === weekName) {
          configSheet.getRange('E' + r).setValue(targetLabel);
          found = true;
          break;
        }
      }
    }

    // Nếu chưa tìm thấy, thử tìm ở bảng cũ 2 cột (từ dòng 7, tên ở cột A, chỉ tiêu ở cột B)
    if (!found) {
      for (var r = 7; r <= Math.max(lastRow, 8); r++) {
        var val = (configSheet.getRange('A' + r).getValue() || '').toString().trim();
        if (val === weekName) {
          configSheet.getRange('B' + r).setValue(targetLabel);
          found = true;
          break;
        }
      }
    }

    if (!found) {
      return { success: false, message: 'Không tìm thấy tuần/phong trào: ' + weekName };
    }

    try {
      writeLog_(null, 'Đổi chỉ tiêu hoạt động', 'Admin', '', weekName, 'Chuyển chỉ tiêu sang: ' + targetLabel, '', 'Thành công');
    } catch (eLog3) {}

    return {
      success: true,
      message: 'Đã cập nhật yêu cầu của "' + weekName + '" thành: ' + targetLabel,
      targetType: isAll ? 'ALL' : 'UNION',
      targetLabel: targetLabel
    };
  } catch (err) {
    return { success: false, message: 'Lỗi cập nhật yêu cầu tuần: ' + err.toString() };
  }
}

// Xóa một bài nộp khỏi Google Sheet
function adminDeleteSubmission(password, weekName, rowIndex) {
  var auth = verifyAdminPassword(password);
  if (!auth.success) return auth;

  try {
    var ssStudent = getStudentSpreadsheet_();
    var sheet = ssStudent.getSheetByName(sanitizeSheetName_(weekName)) || ssStudent.getSheetByName(weekName);
    if (!sheet) return { success: false, message: 'Không tìm thấy tab tuần: ' + weekName };

    var lastRow = sheet.getLastRow();
    if (rowIndex < 2 || rowIndex > lastRow) {
      return { success: false, message: 'Dòng cần xóa không còn tồn tại trên Sheet.' };
    }

    var delInfo = { name: '', class: '', fileUrl: '' };
    try {
      var rowVals = sheet.getRange(rowIndex, 1, 1, Math.max(5, sheet.getLastColumn())).getValues()[0];
      var hasSttCol = (sheet.getRange(1, 1).getValue() || '').toString().trim().toUpperCase() === 'STT';
      if (hasSttCol) {
        delInfo.name = (rowVals[1] || '').toString();
        delInfo.class = (rowVals[2] || '').toString();
        delInfo.fileUrl = (rowVals[4] || '').toString();
      } else {
        delInfo.name = (rowVals[1] || '').toString();
        delInfo.class = (rowVals[2] || '').toString();
        delInfo.fileUrl = (rowVals[3] || '').toString();
      }
    } catch (eInfo) {}

    // 1. Xóa file tương ứng trên Google Drive nếu có
    if (delInfo.fileUrl) {
      deleteDriveFileByUrl_(delInfo.fileUrl);
    }

    // 2. Xóa khỏi tab hoạt động
    sheet.deleteRow(rowIndex);

    // 3. Xóa tương ứng trên Sheet chính DanhSachHocSinh nếu có
    try {
      var mainSheet = ssStudent.getSheetByName('DanhSachHocSinh');
      if (mainSheet && delInfo.fileUrl) {
        var mainLast = mainSheet.getLastRow();
        if (mainLast >= 2) {
          var mainVals = mainSheet.getRange(2, 1, mainLast - 1, Math.max(7, mainSheet.getLastColumn())).getValues();
          for (var m = 0; m < mainVals.length; m++) {
            var mUrl = (mainVals[m][6] || '').toString();
            if (mUrl === delInfo.fileUrl || (delInfo.name && mainVals[m][3] === delInfo.name && mainVals[m][1] === delInfo.class && mainVals[m][4] === weekName)) {
              mainSheet.deleteRow(m + 2);
              break;
            }
          }
          // Đánh lại số thứ tự STT tổng 1..N
          var newMainLast = mainSheet.getLastRow();
          if (newMainLast >= 2) {
            var sttArr = [];
            for (var s = 1; s <= (newMainLast - 1); s++) {
              sttArr.push([s]);
            }
            mainSheet.getRange(2, 1, newMainLast - 1, 1).setValues(sttArr);
          }
        }
      }
    } catch (eMainDel) {}

    // 4. Ghi vào Sheet chuyên biệt Log trên file Admin
    try {
      writeLog_(null, 'Xóa bài nộp', 'Admin', delInfo.class, weekName, 'Xóa bài của: ' + delInfo.name, delInfo.fileUrl, 'Thành công');
    } catch (eLogDel) {}

    return { success: true, message: 'Đã xóa bài nộp thành công.' };
  } catch (err) {
    return { success: false, message: 'Lỗi khi xóa bài nộp: ' + err.toString() };
  }
}

// ============================================================
// QUẢN LÝ DANH SÁCH BÁO CÁO KHÔNG THỰC HIỆN ĐƯỢC (ADMIN)
// ============================================================

// Lấy danh sách học sinh báo không thực hiện được
function getAdminNonCompletionReports(password, weekFilter, classFilter) {
  var auth = verifyAdminPassword(password);
  if (!auth.success) return auth;

  try {
    checkConfigured_();
    var ssStudent = getStudentSpreadsheet_();
    var sheet = ssStudent.getSheetByName('BaoKhongThucHien');
    if (!sheet) {
      return { success: true, reports: [], totalCount: 0 };
    }

    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return { success: true, reports: [], totalCount: 0 };
    }

    var numRows = lastRow - 1;
    var values = sheet.getRange(2, 1, numRows, 8).getValues();
    var reports = [];

    weekFilter = (weekFilter || '').toString().trim();
    classFilter = (classFilter || '').toString().trim();

    for (var i = 0; i < numRows; i++) {
      var rowNumber = i + 2;
      var sttVal = values[i][0];
      var timeVal = values[i][1];
      var classVal = (values[i][2] || '').toString().trim();
      var classSttVal = values[i][3];
      var nameVal = (values[i][4] || '').toString().trim();
      var weekVal = (values[i][5] || '').toString().trim();
      var reasonVal = (values[i][6] || '').toString().trim();
      var noteVal = (values[i][7] || '').toString().trim();

      if (weekFilter && weekFilter !== 'ALL' && weekVal !== weekFilter) {
        continue;
      }

      if (classFilter && classFilter !== 'ALL' && classVal !== classFilter) {
        continue;
      }

      if (timeVal instanceof Date) {
        timeVal = Utilities.formatDate(timeVal, "GMT+7", "dd/MM/yyyy HH:mm:ss");
      } else {
        timeVal = (timeVal || '').toString();
      }

      reports.push({
        rowIndex: rowNumber,
        stt: sttVal,
        timestamp: timeVal,
        className: classVal,
        classStt: classSttVal,
        fullName: nameVal,
        activityName: weekVal,
        reason: reasonVal,
        note: noteVal
      });
    }

    return {
      success: true,
      reports: reports,
      totalCount: reports.length
    };
  } catch (err) {
    return { success: false, message: 'Lỗi tải danh sách báo không thực hiện: ' + err.toString() };
  }
}

// Xóa một báo cáo không thực hiện được khỏi Sheet
function adminDeleteNonCompletionReport(password, rowIndex) {
  var auth = verifyAdminPassword(password);
  if (!auth.success) return auth;

  try {
    checkConfigured_();
    var ssStudent = getStudentSpreadsheet_();
    var sheet = ssStudent.getSheetByName('BaoKhongThucHien');
    if (!sheet) {
      return { success: false, message: 'Không tìm thấy tab BaoKhongThucHien trên Sheet.' };
    }

    var lastRow = sheet.getLastRow();
    if (rowIndex < 2 || rowIndex > lastRow) {
      return { success: false, message: 'Dòng cần xóa không còn tồn tại.' };
    }

    var delInfo = { name: '', class: '', activity: '', reason: '' };
    try {
      var rowVals = sheet.getRange(rowIndex, 1, 1, 8).getValues()[0];
      delInfo.class = (rowVals[2] || '').toString();
      delInfo.name = (rowVals[4] || '').toString();
      delInfo.activity = (rowVals[5] || '').toString();
      delInfo.reason = (rowVals[6] || '').toString();
    } catch (eInfo) {}

    sheet.deleteRow(rowIndex);

    // Đánh lại STT cột 1
    var newLastRow = sheet.getLastRow();
    if (newLastRow >= 2) {
      var numRows = newLastRow - 1;
      var sttCol = [];
      for (var s = 1; s <= numRows; s++) {
        sttCol.push([s]);
      }
      sheet.getRange(2, 1, numRows, 1).setValues(sttCol);
    }

    // Ghi log
    try {
      writeLog_(
        null,
        'Xóa báo không thực hiện',
        'Admin',
        delInfo.class,
        delInfo.activity,
        'Xóa báo cáo của: ' + delInfo.name + (delInfo.reason ? (' (Lý do: ' + delInfo.reason + ')') : ''),
        '',
        'Thành công'
      );
    } catch (eLogDel) {}

    return { success: true, message: 'Đã xóa báo cáo không tham gia thành công.' };
  } catch (err) {
    return { success: false, message: 'Lỗi khi xóa báo cáo: ' + err.toString() };
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

    try {
      writeLog_(null, 'Đổi mật khẩu Admin', 'Admin', '', '', 'Mật khẩu quản trị đã được cập nhật', '', 'Thành công');
    } catch (eLog4) {}

    return { success: true, message: 'Đổi mật khẩu trang Admin thành công!' };
  } catch (err) {
    return { success: false, message: 'Lỗi khi lưu mật khẩu mới: ' + err.toString() };
  }
}

// Định dạng lại các tab từ giao diện Admin
function adminFormatAllSheets(password) {
  var auth = verifyAdminPassword(password);
  if (!auth.success) return auth;

  try {
    trangTriTatCaCacTuan();

    try {
      writeLog_(null, 'Định dạng lại trang tính', 'Admin', '', '', 'Kẻ bảng và trang trí lại tất cả các sheet (DanhSachHocSinh, Config, Log, DanhSachLop, Hoạt động)', '', 'Thành công');
    } catch (eLog5) {}

    return { success: true, message: 'Đã định dạng và kẻ bảng lại tất cả các tab thành công!' };
  } catch (err) {
    return { success: false, message: 'Lỗi định dạng tab: ' + err.toString() };
  }
}

// ============================================================
// LẤY DỮ LIỆU NHẬT KÝ HỆ THỐNG CHO TRANG ADMIN
// ============================================================

function getAdminLogs(password, limit) {
  var auth = verifyAdminPassword(password);
  if (!auth.success) return auth;

  try {
    checkConfigured_();
    var ssAdmin = getAdminSpreadsheet_();
    var logSheet = ssAdmin.getSheetByName('Log');
    if (!logSheet) {
      return { success: true, logs: [] };
    }

    var lastRow = logSheet.getLastRow();
    if (lastRow <= 1) {
      return { success: true, logs: [] };
    }

    var maxItems = limit || 100;
    var startRow = Math.max(2, lastRow - maxItems + 1);
    var count = lastRow - startRow + 1;

    var values = logSheet.getRange(startRow, 1, count, 8).getValues();
    var richTexts = logSheet.getRange(startRow, 7, count, 1).getRichTextValues();

    var logs = [];
    for (var i = values.length - 1; i >= 0; i--) {
      var timeVal = values[i][0];
      if (timeVal instanceof Date) {
        timeVal = Utilities.formatDate(timeVal, "GMT+7", "dd/MM/yyyy HH:mm:ss");
      }
      var linkVal = '';
      if (richTexts[i] && richTexts[i][0] && richTexts[i][0].getLinkUrl()) {
        linkVal = richTexts[i][0].getLinkUrl();
      } else if (values[i][6]) {
        linkVal = values[i][6].toString();
      }

      logs.push({
        timestamp: (timeVal || '').toString(),
        action: (values[i][1] || '').toString(),
        actor: (values[i][2] || '').toString(),
        className: (values[i][3] || '').toString(),
        activityName: (values[i][4] || '').toString(),
        details: (values[i][5] || '').toString(),
        linkUrl: linkVal,
        status: (values[i][7] || 'Thành công').toString()
      });
    }

    return { success: true, logs: logs };
  } catch (err) {
    return { success: false, message: 'Lỗi nạp nhật ký hệ thống: ' + err.toString() };
  }
}

// Xóa sạch nhật ký (chỉ giữ lại header)
function adminClearLogs(password) {
  var auth = verifyAdminPassword(password);
  if (!auth.success) return auth;

  try {
    checkConfigured_();
    var ssAdmin = getAdminSpreadsheet_();
    var logSheet = ssAdmin.getSheetByName('Log');
    if (logSheet && logSheet.getLastRow() > 1) {
      logSheet.getRange(2, 1, logSheet.getLastRow() - 1, 8).clearContent();
    }
    writeLog_(ssAdmin, 'Xóa nhật ký', 'Admin', '', '', 'Đã dọn dẹp các dòng log cũ', '', 'Thành công');
    return { success: true, message: 'Đã dọn dẹp nhật ký cũ thành công!' };
  } catch (err) {
    return { success: false, message: 'Lỗi dọn dẹp nhật ký: ' + err.toString() };
  }
}
