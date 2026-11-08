const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DOCS_DIR = path.join(__dirname, 'docs');
if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });

const indexHtmlRaw = fs.readFileSync(path.join(__dirname, 'Index.html'), 'utf8');
const adminHtmlRaw = fs.readFileSync(path.join(__dirname, 'Admin.html'), 'utf8');

// Mock data chung
const mockData = {
  schoolName: 'Trường THPT Phan Việt Thống',
  title: 'Web Thu Hình Ảnh\nHoạt Động Đoàn',
  note: 'Năm học 2024 - 2025',
  weeks: [
    {
      name: 'Tìm hiểu 94 năm ngày truyền thống thành lập Đoàn TNCS Hồ Chí Minh',
      startDate: '01/03/2025',
      endDate: '10/03/2025',
      targetType: 'UNION',
      targetLabel: 'Đoàn viên',
      ghiChu: 'Chụp rõ ảnh giấy chứng nhận hoặc kết quả trắc nghiệm trực tuyến',
      stt: 1
    },
    {
      name: 'Hội thi Thanh niên Khỏe - Tiến bước lên Đoàn',
      startDate: '12/03/2025',
      endDate: '20/03/2025',
      targetType: 'ALL',
      targetLabel: 'Cả lớp',
      ghiChu: 'Minh chứng hình ảnh tham gia thi đấu hoặc cổ vũ',
      stt: 2
    }
  ],
  classes: [
    { className: '12A1', grade: '12', siSo: 43, soDoanVien: 40, ghiChu: 'Đạt chuẩn xuất sắc' },
    { className: '12A2', grade: '12', siSo: 44, soDoanVien: 42, ghiChu: 'Chi đoàn vững mạnh' },
    { className: '12A3', grade: '12', siSo: 41, soDoanVien: 38, ghiChu: 'Chi đoàn tiêu biểu' },
    { className: '12A4', grade: '12', siSo: 45, soDoanVien: 41, ghiChu: 'Đoàn kết tốt' },
    { className: '11A1', grade: '11', siSo: 42, soDoanVien: 40, ghiChu: 'Tích cực phong trào' },
    { className: '11A2', grade: '11', siSo: 45, soDoanVien: 42, ghiChu: 'Chi đoàn nòng cốt' },
    { className: '10A1', grade: '10', siSo: 46, soDoanVien: 40, ghiChu: 'Đoàn viên mới' }
  ],
  classProgressModal: [
    { className: '12A1', grade: '12', targetCount: 40, submittedCount: 40, missingCount: 0, completionRate: 100, isCompleted: true, badgeClass: 'badge-done', badgeText: 'Hoàn thành' },
    { className: '12A2', grade: '12', targetCount: 42, submittedCount: 42, missingCount: 0, completionRate: 100, isCompleted: true, badgeClass: 'badge-done', badgeText: 'Hoàn thành' },
    { className: '12A3', grade: '12', targetCount: 38, submittedCount: 38, missingCount: 0, completionRate: 100, isCompleted: true, badgeClass: 'badge-done', badgeText: 'Hoàn thành' },
    { className: '12A4', grade: '12', targetCount: 41, submittedCount: 41, missingCount: 0, completionRate: 100, isCompleted: true, badgeClass: 'badge-done', badgeText: 'Hoàn thành' },
    { className: '11A1', grade: '11', targetCount: 40, submittedCount: 25, missingCount: 15, completionRate: 63, isCompleted: false, badgeClass: 'badge-doing', badgeText: 'Đang làm (63%)' },
    { className: '11A2', grade: '11', targetCount: 42, submittedCount: 15, missingCount: 27, completionRate: 36, isCompleted: false, badgeClass: 'badge-doing', badgeText: 'Đang làm (36%)' },
    { className: '10A1', grade: '10', targetCount: 40, submittedCount: 0, missingCount: 40, completionRate: 0, isCompleted: false, badgeClass: 'badge-zero', badgeText: 'Chưa nộp' }
  ],
  adminClassProgress: [
    { className: '12A1', grade: '12', siSo: 43, totalStudents: 43, soDoanVien: 40, unionMembers: 40, target: 40, targetCount: 40, submittedCount: 40, submitted: 40, missingCount: 0, missing: 0, percentage: 100, status: 'COMPLETED', statusLabel: 'Hoàn thành' },
    { className: '12A2', grade: '12', siSo: 44, totalStudents: 44, soDoanVien: 42, unionMembers: 42, target: 42, targetCount: 42, submittedCount: 42, submitted: 42, missingCount: 0, missing: 0, percentage: 100, status: 'COMPLETED', statusLabel: 'Hoàn thành' },
    { className: '12A3', grade: '12', siSo: 41, totalStudents: 41, soDoanVien: 38, unionMembers: 38, target: 38, targetCount: 38, submittedCount: 38, submitted: 38, missingCount: 0, missing: 0, percentage: 100, status: 'COMPLETED', statusLabel: 'Hoàn thành' },
    { className: '12A4', grade: '12', siSo: 45, totalStudents: 45, soDoanVien: 41, unionMembers: 41, target: 41, targetCount: 41, submittedCount: 41, submitted: 41, missingCount: 0, missing: 0, percentage: 100, status: 'COMPLETED', statusLabel: 'Hoàn thành' },
    { className: '11A1', grade: '11', siSo: 42, totalStudents: 42, soDoanVien: 40, unionMembers: 40, target: 40, targetCount: 40, submittedCount: 25, submitted: 25, missingCount: 15, missing: 15, percentage: 63, status: 'IN_PROGRESS', statusLabel: 'Đang làm' },
    { className: '11A2', grade: '11', siSo: 45, totalStudents: 45, soDoanVien: 42, unionMembers: 42, target: 42, targetCount: 42, submittedCount: 15, submitted: 15, missingCount: 27, missing: 27, percentage: 36, status: 'IN_PROGRESS', statusLabel: 'Đang làm' },
    { className: '10A1', grade: '10', siSo: 46, totalStudents: 46, soDoanVien: 40, unionMembers: 40, target: 40, targetCount: 40, submittedCount: 0, submitted: 0, missingCount: 40, missing: 40, percentage: 0, status: 'NOT_STARTED', statusLabel: 'Chưa nộp' }
  ],
  nonCompletionReports: [
    {
      rowIndex: 2,
      stt: 1,
      timestamp: '03/03/2025 08:35:12',
      className: '12A3',
      classStt: 12,
      fullName: 'Trần Minh Quân',
      activityName: 'Tìm hiểu 94 năm ngày truyền thống thành lập Đoàn TNCS Hồ Chí Minh',
      reason: 'Nghỉ ốm có giấy phép của phụ huynh từ ngày 02/03 đến 06/03/2025',
      note: 'Đã xác nhận GVCN'
    },
    {
      rowIndex: 3,
      stt: 2,
      timestamp: '04/03/2025 14:15:20',
      className: '11A1',
      classStt: 8,
      fullName: 'Lê Hoàng Yến',
      activityName: 'Tìm hiểu 94 năm ngày truyền thống thành lập Đoàn TNCS Hồ Chí Minh',
      reason: 'Điện thoại bị hỏng màn hình đang gửi bảo hành tại trung tâm',
      note: 'Chờ xác nhận'
    },
    {
      rowIndex: 4,
      stt: 3,
      timestamp: '05/03/2025 19:40:05',
      className: '10A1',
      classStt: 25,
      fullName: 'Phạm Đức Trọng',
      activityName: 'Tìm hiểu 94 năm ngày truyền thống thành lập Đoàn TNCS Hồ Chí Minh',
      reason: 'Tham gia đội tuyển bồi dưỡng học sinh giỏi tỉnh bận lịch tập huấn',
      note: 'Đã xác nhận GVCN'
    }
  ]
};

const mockScriptCommon = `
<script>
function createRunner() {
  return {
    _success: function() {},
    _fail: function() {},
    withSuccessHandler: function(fn) { this._success = fn; return this; },
    withFailureHandler: function(fn) { this._fail = fn; return this; },
      layThongTinConfig: function() {
        var self = this;
        setTimeout(function() {
          self._success({
            tenTruong: ${JSON.stringify(mockData.schoolName)},
            tieuDe: ${JSON.stringify(mockData.title)},
            ghiChu: ${JSON.stringify(mockData.note)},
            weeks: ${JSON.stringify(mockData.weeks)},
            classList: ${JSON.stringify(mockData.classes.map(c => c.className))},
            adminUrl: '#'
          });
        }, 5);
      },
      getFormConfig: function() { this.layThongTinConfig(); },
      getPublicProgress: function(week) {
        var self = this;
        setTimeout(function() {
          self._success({
            success: true,
            weekName: ${JSON.stringify(mockData.weeks[0].name)},
            startDate: '01/03/2025',
            endDate: '10/03/2025',
            targetType: 'UNION',
            targetLabel: 'Đoàn viên',
            progressSummary: {
              totalTarget: 283,
              totalSubmitted: 201,
              overallRate: 71.0,
              totalClasses: 7,
              completedClasses: 4,
              inProgressClasses: 2,
              notStartedClasses: 1
            },
            classProgress: ${JSON.stringify(mockData.classProgressModal)},
            weeks: ${JSON.stringify(mockData.weeks)}
          });
        }, 5);
      },
      getAdminOverview: function(pass) {
        var self = this;
        setTimeout(function() {
          self._success({
            success: true,
            config: {
              tenTruong: ${JSON.stringify(mockData.schoolName)},
              tieuDe: ${JSON.stringify(mockData.title)},
              ghiChu: ${JSON.stringify(mockData.note)},
              subfolderByClass: true,
              weeks: ${JSON.stringify(mockData.weeks)}
            },
            classes: ${JSON.stringify(mockData.classes)},
            weekStats: [
              {
                stt: 1,
                name: ${JSON.stringify(mockData.weeks[0].name)},
                startDate: '01/03/2025',
                endDate: '10/03/2025',
                targetType: 'UNION',
                targetLabel: 'Đoàn viên',
                count: 201,
                sheetExists: true
              },
              {
                stt: 2,
                name: ${JSON.stringify(mockData.weeks[1].name)},
                startDate: '12/03/2025',
                endDate: '20/03/2025',
                targetType: 'ALL',
                targetLabel: 'Cả lớp',
                count: 0,
                sheetExists: true
              }
            ],
            mainStudentCount: 201,
            logCount: 36,
            nonCompletionCount: 3,
            formUrl: '#',
            spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/dummy-student',
            adminSpreadsheetUrl: 'https://docs.google.com/spreadsheets/d/dummy-admin',
            driveFolderUrl: 'https://drive.google.com/drive/folders/dummy-folder'
          });
        }, 5);
      },
      getAdminClassProgress: function(pass, week) {
        var self = this;
        setTimeout(function() {
          self._success({
            success: true,
            weekName: ${JSON.stringify(mockData.weeks[0].name)},
            startDate: '01/03/2025',
            endDate: '10/03/2025',
            targetType: 'UNION',
            targetLabel: 'Đoàn viên',
            ghiChu: 'Chụp rõ ảnh giấy chứng nhận hoặc kết quả trắc nghiệm trực tuyến',
            progressSummary: {
              totalTarget: 283,
              targetLabel: 'Đoàn viên',
              totalClasses: 7,
              totalSubmitted: 201,
              overallPercentage: 71,
              totalMissingStudents: 82,
              completedClasses: 4
            },
            classProgress: ${JSON.stringify(mockData.adminClassProgress)}
          });
        }, 5);
      },
      getAdminSubmissions: function(pass, week) {
        var self = this;
        setTimeout(function() {
          self._success({
            success: true,
            weekName: ${JSON.stringify(mockData.weeks[0].name)},
            startDate: '01/03/2025',
            endDate: '10/03/2025',
            targetType: 'UNION',
            targetLabel: 'Đoàn viên',
            progressSummary: {
              totalTarget: 283,
              totalSubmitted: 201,
              totalMissingStudents: 82,
              completedClasses: 4,
              totalClasses: 7,
              overallPercentage: 71
            },
            classProgress: ${JSON.stringify(mockData.adminClassProgress)},
            submissions: [
              { rowIndex: 2, stt: 1, fullName: 'Nguyễn Văn An', className: '12A1', timestamp: '02/03/2025 08:30:15', fileUrl: 'https://drive.google.com/sample1', submitCount: 1 },
              { rowIndex: 3, stt: 2, fullName: 'Trần Thị Bích', className: '12A1', timestamp: '02/03/2025 09:12:44', fileUrl: 'https://drive.google.com/sample2', submitCount: 2 },
              { rowIndex: 4, stt: 3, fullName: 'Lê Hoàng Nam', className: '12A1', timestamp: '03/03/2025 14:05:22', fileUrl: 'https://drive.google.com/sample3', submitCount: 3 },
              { rowIndex: 5, stt: 4, fullName: 'Phạm Minh Khang', className: '12A2', timestamp: '03/03/2025 15:20:10', fileUrl: 'https://drive.google.com/sample4', submitCount: 1 },
              { rowIndex: 6, stt: 5, fullName: 'Đặng Thảo Vy', className: '12A2', timestamp: '04/03/2025 10:15:33', fileUrl: 'https://drive.google.com/sample5', submitCount: 2 }
            ],
            stats: { totalSubmissions: 5, classStats: { '12A1': 3, '12A2': 2 } }
          });
        }, 5);
      },
      checkStudentSubmissionStatus: function(fullName, className, stt, week) {
        var self = this;
        setTimeout(function() {
          self._success({
            exists: true,
            count: 1,
            maxCount: 3,
            canSubmit: true,
            lastFileUrl: 'https://drive.google.com/sample',
            lastTimestamp: '02/03/2025 08:30:15',
            message: 'Học sinh Nguyễn Văn An đã nộp 1/3 lần. Bạn vẫn có thể nộp lại (file mới sẽ thay thế file cũ).'
          });
        }, 5);
      },
      submitNonCompletionReport: function(name, cls, stt, week, reason) {
        var self = this;
        setTimeout(function() {
          self._success({
            success: true,
            isUpdate: false,
            message: 'Đã ghi nhận thông báo lý do không thể tham gia của bạn. Nhà trường và GVCN sẽ xem xét!'
          });
        }, 5);
      },
      getAdminNonCompletionReports: function(pass, week, cls) {
        var self = this;
        self._success({
          success: true,
          reports: ${JSON.stringify(mockData.nonCompletionReports)},
          totalCount: ${mockData.nonCompletionReports.length}
        });
      },
      adminDeleteNonCompletionReport: function(pass, idx) {
        var self = this;
        setTimeout(function() {
          self._success({
            success: true,
            message: 'Đã xóa báo cáo không tham gia thành công.'
          });
        }, 5);
      },
      getScriptServiceUrl: function() {
        var self = this;
        setTimeout(function() { self._success('https://script.google.com/macros/s/AKfycb.../exec'); }, 5);
      }
    };
  }

window.google = {
  script: {
    get run() {
      return createRunner();
    }
  }
};
</script>
`;

function prepareHtml(raw) {
  let res = raw.replace('<head>', '<head>' + mockScriptCommon);
  res = res.replace(/<\?=\s*adminUrl\s*\?>/g, '#');
  res = res.replace(/<\?=\s*formUrl\s*\?>/g, '#');
  return res;
}

// 1. Form học sinh
let pageForm = prepareHtml(indexHtmlRaw);
pageForm += `
<script>
window.addEventListener('load', function() {
  setTimeout(function() {
    document.getElementById('fullName').value = 'Nguyễn Văn An';
    document.getElementById('className').value = '12A1';
    document.getElementById('sttNumber').value = '1';
    var sel = document.getElementById('weekSelect');
    if (sel && sel.options.length > 1) {
      sel.selectedIndex = 1;
      sel.dispatchEvent(new Event('change'));
    }
    if (typeof checkStudentSubmissionStatusAsync === 'function') {
      checkStudentSubmissionStatusAsync();
    }
  }, 120);
});
</script>
`;

// 2. Modal Tiến độ
let pageProgress = prepareHtml(indexHtmlRaw);
pageProgress += `
<script>
window.addEventListener('load', function() {
  setTimeout(function() {
    if (typeof openProgressModal === 'function') {
      openProgressModal();
    }
  }, 100);
});
</script>
`;

// 2b. Modal Nội quy nộp minh chứng
let pageRules = prepareHtml(indexHtmlRaw);
pageRules += `
<script>
window.addEventListener('load', function() {
  setTimeout(function() {
    if (typeof openRulesModal === 'function') {
      openRulesModal();
    }
  }, 100);
});
</script>
`;

// 2c. Modal Báo không thực hiện được
let pageNonComp = prepareHtml(indexHtmlRaw);
pageNonComp += `
<script>
window.addEventListener('load', function() {
  setTimeout(function() {
    document.getElementById('fullName').value = 'Trần Minh Quân';
    document.getElementById('className').value = '12A3';
    document.getElementById('sttNumber').value = '12';
    if (typeof openNonCompletionModal === 'function') {
      openNonCompletionModal();
      setTimeout(function() {
        var reasonEl = document.getElementById('ncReason');
        if (reasonEl) reasonEl.value = 'Nghỉ ốm có giấy phép của phụ huynh từ ngày 02/03 đến 06/03/2025 (điều trị sốt xuất huyết tại nhà).';
      }, 50);
    }
  }, 120);
});
</script>
`;

// 3. Admin Dashboard
let pageAdmin = prepareHtml(adminHtmlRaw);
pageAdmin += `
<script>
window.addEventListener('load', function() {
  setTimeout(function() {
    adminToken = 'sample_pass';
    document.getElementById('loginView').classList.add('hidden');
    document.getElementById('adminDashboard').classList.remove('hidden');
    loadOverview();
    setTimeout(function() {
      selectWeek(${JSON.stringify(mockData.weeks[0].name)});
    }, 80);
  }, 50);
});
</script>
`;

// 4. Admin Classes
let pageAdminClasses = prepareHtml(adminHtmlRaw);
pageAdminClasses += `
<script>
window.addEventListener('load', function() {
  setTimeout(function() {
    adminToken = 'sample_pass';
    document.getElementById('loginView').classList.add('hidden');
    document.getElementById('adminDashboard').classList.remove('hidden');
    loadOverview();
    setTimeout(function() {
      switchTab('classesTab');
    }, 80);
  }, 50);
});
</script>
`;

// 5. Admin Config
let pageAdminConfig = prepareHtml(adminHtmlRaw);
pageAdminConfig += `
<script>
window.addEventListener('load', function() {
  setTimeout(function() {
    adminToken = 'sample_pass';
    document.getElementById('loginView').classList.add('hidden');
    document.getElementById('adminDashboard').classList.remove('hidden');
    loadOverview();
    setTimeout(function() {
      switchTab('configTab');
    }, 80);
  }, 50);
});
</script>
`;

// 6. Admin Non-completion Reports Tab
let pageAdminNonComp = prepareHtml(adminHtmlRaw);
pageAdminNonComp += `
<script>
window.addEventListener('load', function() {
  setTimeout(function() {
    adminToken = 'sample_pass';
    document.getElementById('loginView').classList.add('hidden');
    document.getElementById('adminDashboard').classList.remove('hidden');
    loadOverview();
    setTimeout(function() {
      switchTab('nonCompletionTab');
      var btn = document.getElementById('nonCompletionTabBtn');
      if (btn) btn.classList.add('active');
    }, 80);
  }, 50);
});
</script>
`;

const items = [
  {
    htmlFile: 'temp-student-form.html',
    content: pageForm,
    outputImg: 'demo-student-form.png',
    width: 1240,
    height: 1020
  },
  {
    htmlFile: 'temp-student-progress.html',
    content: pageProgress,
    outputImg: 'demo-student-progress.png',
    width: 1240,
    height: 980
  },
  {
    htmlFile: 'temp-rules-modal.html',
    content: pageRules,
    outputImg: 'demo-rules-modal.png',
    width: 1240,
    height: 980
  },
  {
    htmlFile: 'temp-non-completion-modal.html',
    content: pageNonComp,
    outputImg: 'demo-non-completion-modal.png',
    width: 1240,
    height: 980
  },
  {
    htmlFile: 'temp-admin-dashboard.html',
    content: pageAdmin,
    outputImg: 'demo-admin-dashboard.png',
    width: 1400,
    height: 1040
  },
  {
    htmlFile: 'temp-admin-classes.html',
    content: pageAdminClasses,
    outputImg: 'demo-admin-classes.png',
    width: 1400,
    height: 880
  },
  {
    htmlFile: 'temp-admin-config.html',
    content: pageAdminConfig,
    outputImg: 'demo-admin-config.png',
    width: 1400,
    height: 880
  },
  {
    htmlFile: 'temp-admin-non-completion.html',
    content: pageAdminNonComp,
    outputImg: 'demo-admin-non-completion.png',
    width: 1400,
    height: 880
  }
];

const EDGE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

for (const it of items) {
  const htmlPath = path.join(DOCS_DIR, it.htmlFile);
  const imgPath = path.join(DOCS_DIR, it.outputImg);
  fs.writeFileSync(htmlPath, it.content, 'utf8');

  const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');
  const targetImg = imgPath.replace(/\\/g, '/');

  console.log(`Generating ${it.outputImg}...`);

  const args = [
    `'--headless=new'`,
    `'--user-data-dir=C:/Users/Tri/AppData/Local/Temp/edge_demo_tmp'`,
    `'--hide-scrollbars'`,
    `'--virtual-time-budget=2000'`,
    `'--window-size=${it.width},${it.height}'`,
    `'--screenshot=${targetImg}'`,
    `'${fileUrl}'`
  ].join(', ');

  const psCmd = `powershell -NoProfile -Command "Start-Process '${EDGE_PATH}' -ArgumentList ${args} -Wait"`;
  try {
    execSync(psCmd, { stdio: 'inherit' });
    if (fs.existsSync(imgPath)) {
      const sz = Math.round(fs.statSync(imgPath).size / 1024);
      console.log(`✓ ${it.outputImg} created (${sz} KB)`);
    } else {
      console.error(`✗ Missing ${it.outputImg}`);
    }
  } catch (e) {
    console.error(`Error for ${it.outputImg}:`, e.message);
  } finally {
    if (fs.existsSync(htmlPath)) fs.unlinkSync(htmlPath);
  }
}

console.log('All screenshots completed successfully!');
