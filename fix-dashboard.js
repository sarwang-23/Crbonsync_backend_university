const fs = require('fs');
const path = 'src/modules/dashboard/dashboard.controller.ts';
let content = fs.readFileSync(path, 'utf8');

// Fix universityId across all endpoints
content = content.replace(/const universityId = String\(req\.query\.universityId\);\n\s*if \(\!universityId\)/g, 'const universityId = req.query.universityId ? String(req.query.universityId) : "";\n    if (!universityId)');

// Also fix baselineComparison which has slightly different logic
content = content.replace(/const universityId = String\(req\.query\.universityId\);\n\s*const currentPeriodId = String\(req\.query\.reportingPeriodId\);/g, 'const universityId = req.query.universityId ? String(req.query.universityId) : "";\n    const currentPeriodId = req.query.reportingPeriodId ? String(req.query.reportingPeriodId) : "";');

// Fix getSummary reportingPeriodId logic
content = content.replace(/const reportingPeriodId = req\.query\.reportingPeriodId \? String\(req\.query\.reportingPeriodId\) \: undefined;/, 'const reportingPeriodId = req.query.reportingPeriodId ? String(req.query.reportingPeriodId) : "";\n    if (!reportingPeriodId) return res.status(400).json({ success: false, message: "reportingPeriodId is required for dashboard summary" });');

// Remove ! from getBaselineComparison in getSummary
content = content.replace(/getBaselineComparison\(universityId, reportingPeriodId\!\)/, 'getBaselineComparison(universityId, reportingPeriodId)');

fs.writeFileSync(path, content);
console.log('Fixed dashboard.controller.ts');
