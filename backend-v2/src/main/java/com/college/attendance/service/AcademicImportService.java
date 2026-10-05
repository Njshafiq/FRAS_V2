package com.college.attendance.service;

import com.college.attendance.dto.BulkAcademicImportResponse;
import com.college.attendance.dto.RowFailure;
import com.college.attendance.dto.SheetImportSummary;
import com.college.attendance.model.AcademicYear;
import com.college.attendance.model.ClassEntity;
import com.college.attendance.model.Curriculum;
import com.college.attendance.model.Department;
import com.college.attendance.model.Subject;
import com.college.attendance.repository.AcademicYearRepository;
import com.college.attendance.repository.ClassEntityRepository;
import com.college.attendance.repository.CurriculumRepository;
import com.college.attendance.repository.DepartmentRepository;
import com.college.attendance.repository.SubjectRepository;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class AcademicImportService {

    private static final Logger log = LoggerFactory.getLogger(AcademicImportService.class);
    private final DataFormatter dataFormatter = new DataFormatter();

    private final DepartmentRepository departmentRepository;
    private final ClassEntityRepository classEntityRepository;
    private final SubjectRepository subjectRepository;
    private final CurriculumRepository curriculumRepository;
    private final AcademicYearRepository academicYearRepository;
    private final AdminAuditLogService auditLogService;

    public AcademicImportService(DepartmentRepository departmentRepository,
                                 ClassEntityRepository classEntityRepository,
                                 SubjectRepository subjectRepository,
                                 CurriculumRepository curriculumRepository,
                                 AcademicYearRepository academicYearRepository,
                                 AdminAuditLogService auditLogService) {
        this.departmentRepository = departmentRepository;
        this.classEntityRepository = classEntityRepository;
        this.subjectRepository = subjectRepository;
        this.curriculumRepository = curriculumRepository;
        this.academicYearRepository = academicYearRepository;
        this.auditLogService = auditLogService;
    }

    // -------------------------------------------------------------
    // Combined Academic Excel Import (Academic_Data.xlsx)
    // -------------------------------------------------------------
    @Transactional
    public BulkAcademicImportResponse importCombinedAcademicData(MultipartFile file, String adminUsername) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Academic Excel file is required.");
        }

        String filename = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
        if (!filename.endsWith(".xlsx") && !filename.endsWith(".xls")) {
            throw new IllegalArgumentException("Combined academic import requires an Excel (.xlsx or .xls) file.");
        }

        List<SheetImportSummary> summaries = new ArrayList<>();
        int totalProcessed = 0;
        int totalSuccess = 0;
        int totalFailed = 0;

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            // 1. Process Departments sheet
            Sheet deptSheet = findSheet(workbook, "Departments", "Department");
            if (deptSheet != null) {
                SheetImportSummary deptSummary = processDepartmentsSheet(deptSheet);
                summaries.add(deptSummary);
                totalProcessed += deptSummary.totalRows();
                totalSuccess += deptSummary.successCount();
                totalFailed += deptSummary.failedCount();
            }

            // 2. Process Classes_Sections sheet
            Sheet classSheet = findSheet(workbook, "Classes_Sections", "Classes", "Class_Sections", "Sections");
            if (classSheet != null) {
                SheetImportSummary classSummary = processClassesSheet(classSheet);
                summaries.add(classSummary);
                totalProcessed += classSummary.totalRows();
                totalSuccess += classSummary.successCount();
                totalFailed += classSummary.failedCount();
            }

            // 3. Process Subjects sheet
            Sheet subSheet = findSheet(workbook, "Subjects", "Subject");
            if (subSheet != null) {
                SheetImportSummary subSummary = processSubjectsSheet(subSheet);
                summaries.add(subSummary);
                totalProcessed += subSummary.totalRows();
                totalSuccess += subSummary.successCount();
                totalFailed += subSummary.failedCount();
            }

            // 4. Process Curriculum sheet
            Sheet currSheet = findSheet(workbook, "Curriculum", "Curriculums");
            if (currSheet != null) {
                SheetImportSummary currSummary = processCurriculumSheet(currSheet);
                summaries.add(currSummary);
                totalProcessed += currSummary.totalRows();
                totalSuccess += currSummary.successCount();
                totalFailed += currSummary.failedCount();
            }

            if (summaries.isEmpty()) {
                throw new IllegalArgumentException("No recognized sheets found. Expected sheets: Departments, Classes_Sections, Subjects, Curriculum.");
            }

            auditLogService.logAction(
                adminUsername,
                "IMPORT_COMBINED_ACADEMIC_DATA",
                "ACADEMIC",
                filename,
                "Processed " + totalProcessed + " rows (" + totalSuccess + " success, " + totalFailed + " failed)",
                null
            );

            String message = String.format("Combined academic import finished. Total: %d, Succeeded: %d, Failed: %d.",
                totalProcessed, totalSuccess, totalFailed);

            return new BulkAcademicImportResponse(totalProcessed, totalSuccess, totalFailed, summaries, message);

        } catch (Exception ex) {
            log.error("Failed to parse combined academic Excel file: {}", ex.getMessage(), ex);
            throw new IllegalArgumentException("Could not process combined Excel file: " + ex.getMessage());
        }
    }

    // -------------------------------------------------------------
    // Individual Import Methods
    // -------------------------------------------------------------
    @Transactional
    public SheetImportSummary importDepartments(MultipartFile file) {
        List<String[]> rows = parseFileRows(file);
        return processDepartmentRows(rows, "Departments");
    }

    @Transactional
    public SheetImportSummary importClasses(MultipartFile file) {
        List<String[]> rows = parseFileRows(file);
        return processClassRows(rows, "Classes_Sections");
    }

    @Transactional
    public SheetImportSummary importSubjects(MultipartFile file) {
        List<String[]> rows = parseFileRows(file);
        return processSubjectRows(rows, "Subjects");
    }

    @Transactional
    public SheetImportSummary importCurriculum(MultipartFile file) {
        List<String[]> rows = parseFileRows(file);
        return processCurriculumRows(rows, "Curriculum");
    }

    // -------------------------------------------------------------
    // Processing Logic
    // -------------------------------------------------------------
    private SheetImportSummary processDepartmentsSheet(Sheet sheet) {
        List<String[]> rows = readSheetRows(sheet);
        return processDepartmentRows(rows, sheet.getSheetName());
    }

    private SheetImportSummary processDepartmentRows(List<String[]> rows, String sheetName) {
        if (rows.isEmpty()) {
            return new SheetImportSummary(sheetName, 0, 0, 0, List.of());
        }
        Map<String, Integer> map = mapHeaders(rows.getFirst());
        int total = 0, success = 0, failed = 0;
        List<RowFailure> failures = new ArrayList<>();

        for (int i = 1; i < rows.size(); i++) {
            String[] r = rows.get(i);
            if (isEmptyRow(r)) continue;
            total++;
            int rowNum = i + 1;

            String code = readVal(r, map, "code", "department_code", "departmentcode", "dept_code");
            String name = readVal(r, map, "name", "department_name", "departmentname", "dept_name");

            if (code == null || code.isBlank() || name == null || name.isBlank()) {
                failed++;
                failures.add(new RowFailure(rowNum, code != null ? code : "Row " + rowNum, "Missing required Department Code or Name"));
                continue;
            }

            try {
                Optional<Department> existing = departmentRepository.findByDepartmentCode(code.trim());
                if (existing.isPresent()) {
                    Department d = existing.get();
                    d.setName(name.trim());
                    d.setActive(true);
                    departmentRepository.save(d);
                } else {
                    Department d = new Department(code.trim(), name.trim());
                    departmentRepository.save(d);
                }
                success++;
            } catch (Exception ex) {
                failed++;
                failures.add(new RowFailure(rowNum, code, "Database error: " + ex.getMessage()));
            }
        }

        return new SheetImportSummary(sheetName, total, success, failed, failures);
    }

    private SheetImportSummary processClassesSheet(Sheet sheet) {
        List<String[]> rows = readSheetRows(sheet);
        return processClassRows(rows, sheet.getSheetName());
    }

    private SheetImportSummary processClassRows(List<String[]> rows, String sheetName) {
        if (rows.isEmpty()) {
            return new SheetImportSummary(sheetName, 0, 0, 0, List.of());
        }
        Map<String, Integer> map = mapHeaders(rows.getFirst());
        int total = 0, success = 0, failed = 0;
        List<RowFailure> failures = new ArrayList<>();

        for (int i = 1; i < rows.size(); i++) {
            String[] r = rows.get(i);
            if (isEmptyRow(r)) continue;
            total++;
            int rowNum = i + 1;

            String code = readVal(r, map, "code", "class_code", "classcode");
            String name = readVal(r, map, "name", "class_name", "classname");
            String deptCode = readVal(r, map, "department", "department_code", "departmentcode", "dept_code");
            String semVal = readVal(r, map, "semester", "sem");
            String yearVal = readVal(r, map, "academic_year", "academic_year_name", "year_name", "academicyear");

            if (code == null || code.isBlank() || name == null || name.isBlank() || deptCode == null || deptCode.isBlank()) {
                failed++;
                failures.add(new RowFailure(rowNum, code != null ? code : "Row " + rowNum, "Missing required Class Code, Name, or Department"));
                continue;
            }

            Optional<Department> deptOpt = departmentRepository.findByDepartmentCode(deptCode.trim());
            if (deptOpt.isEmpty()) {
                failed++;
                failures.add(new RowFailure(rowNum, code, "Department not found: " + deptCode));
                continue;
            }

            AcademicYear year = null;
            if (yearVal != null && !yearVal.isBlank()) {
                year = academicYearRepository.findByYearName(yearVal.trim()).orElse(null);
            }
            if (year == null) {
                year = academicYearRepository.findByActiveTrue().orElse(null);
            }
            if (year == null) {
                failed++;
                failures.add(new RowFailure(rowNum, code, "No active Academic Year found to associate with class."));
                continue;
            }

            Integer semester = 1;
            if (semVal != null && !semVal.isBlank()) {
                try {
                    semester = Integer.parseInt(semVal.trim());
                } catch (NumberFormatException ignored) {}
            }

            int yearLevel = semester != null ? Math.max(1, (semester + 1) / 2) : 1;

            try {
                Optional<ClassEntity> existing = classEntityRepository.findByClassCode(code.trim());
                if (existing.isPresent()) {
                    ClassEntity c = existing.get();
                    c.setClassName(name.trim());
                    c.setDepartment(deptOpt.get());
                    c.setAcademicYear(year);
                    c.setYearLevel(yearLevel);
                    c.setActive(true);
                    classEntityRepository.save(c);
                } else {
                    ClassEntity c = new ClassEntity(name.trim(), code.trim(), year, deptOpt.get(), yearLevel);
                    classEntityRepository.save(c);
                }
                success++;
            } catch (Exception ex) {
                failed++;
                failures.add(new RowFailure(rowNum, code, "Save error: " + ex.getMessage()));
            }
        }

        return new SheetImportSummary(sheetName, total, success, failed, failures);
    }

    private SheetImportSummary processSubjectsSheet(Sheet sheet) {
        List<String[]> rows = readSheetRows(sheet);
        return processSubjectRows(rows, sheet.getSheetName());
    }

    private SheetImportSummary processSubjectRows(List<String[]> rows, String sheetName) {
        if (rows.isEmpty()) {
            return new SheetImportSummary(sheetName, 0, 0, 0, List.of());
        }
        Map<String, Integer> map = mapHeaders(rows.getFirst());
        int total = 0, success = 0, failed = 0;
        List<RowFailure> failures = new ArrayList<>();

        for (int i = 1; i < rows.size(); i++) {
            String[] r = rows.get(i);
            if (isEmptyRow(r)) continue;
            total++;
            int rowNum = i + 1;

            String code = readVal(r, map, "code", "subject_code", "subjectcode");
            String name = readVal(r, map, "name", "subject_name", "subjectname");
            String deptCode = readVal(r, map, "department", "department_code", "departmentcode", "dept_code");
            String semVal = readVal(r, map, "semester", "sem");
            String creditsVal = readVal(r, map, "credits", "credit");

            if (code == null || code.isBlank() || name == null || name.isBlank() || deptCode == null || deptCode.isBlank()) {
                failed++;
                failures.add(new RowFailure(rowNum, code != null ? code : "Row " + rowNum, "Missing required Subject Code, Name, or Department"));
                continue;
            }

            Optional<Department> deptOpt = departmentRepository.findByDepartmentCode(deptCode.trim());
            if (deptOpt.isEmpty()) {
                failed++;
                failures.add(new RowFailure(rowNum, code, "Department not found: " + deptCode));
                continue;
            }

            Integer semester = 1;
            if (semVal != null && !semVal.isBlank()) {
                try { semester = Integer.parseInt(semVal.trim()); } catch (NumberFormatException ignored) {}
            }
            Integer credits = 3;
            if (creditsVal != null && !creditsVal.isBlank()) {
                try { credits = Integer.parseInt(creditsVal.trim()); } catch (NumberFormatException ignored) {}
            }

            try {
                Optional<Subject> existing = subjectRepository.findBySubjectCode(code.trim());
                if (existing.isPresent()) {
                    Subject s = existing.get();
                    s.setSubjectName(name.trim());
                    s.setDepartment(deptOpt.get());
                    s.setSemester(semester);
                    s.setCredits(credits);
                    s.setActive(true);
                    subjectRepository.save(s);
                } else {
                    Subject s = new Subject(code.trim(), name.trim(), deptOpt.get(), 1, credits);
                    s.setSemester(semester);
                    subjectRepository.save(s);
                }
                success++;
            } catch (Exception ex) {
                failed++;
                failures.add(new RowFailure(rowNum, code, "Save error: " + ex.getMessage()));
            }
        }

        return new SheetImportSummary(sheetName, total, success, failed, failures);
    }

    private SheetImportSummary processCurriculumSheet(Sheet sheet) {
        List<String[]> rows = readSheetRows(sheet);
        return processCurriculumRows(rows, sheet.getSheetName());
    }

    private SheetImportSummary processCurriculumRows(List<String[]> rows, String sheetName) {
        if (rows.isEmpty()) {
            return new SheetImportSummary(sheetName, 0, 0, 0, List.of());
        }
        Map<String, Integer> map = mapHeaders(rows.getFirst());
        int total = 0, success = 0, failed = 0;
        List<RowFailure> failures = new ArrayList<>();

        for (int i = 1; i < rows.size(); i++) {
            String[] r = rows.get(i);
            if (isEmptyRow(r)) continue;
            total++;
            int rowNum = i + 1;

            String reg = readVal(r, map, "regulation", "reg");
            String deptCode = readVal(r, map, "department", "department_code", "departmentcode", "dept_code");
            String semVal = readVal(r, map, "semester", "sem");
            String subCode = readVal(r, map, "subject", "subject_code", "subjectcode");
            String creditsVal = readVal(r, map, "credits", "credit");
            String courseType = readVal(r, map, "course_type", "coursetype", "type");

            if (reg == null || reg.isBlank() || deptCode == null || deptCode.isBlank() ||
                semVal == null || semVal.isBlank() || subCode == null || subCode.isBlank()) {
                failed++;
                failures.add(new RowFailure(rowNum, "Row " + rowNum, "Missing required Regulation, Department, Semester, or Subject Code"));
                continue;
            }

            Optional<Department> deptOpt = departmentRepository.findByDepartmentCode(deptCode.trim());
            if (deptOpt.isEmpty()) {
                failed++;
                failures.add(new RowFailure(rowNum, subCode, "Department not found: " + deptCode));
                continue;
            }

            Optional<Subject> subOpt = subjectRepository.findBySubjectCode(subCode.trim());
            if (subOpt.isEmpty()) {
                failed++;
                failures.add(new RowFailure(rowNum, subCode, "Subject not found: " + subCode));
                continue;
            }

            Integer semester = 1;
            try { semester = Integer.parseInt(semVal.trim()); } catch (NumberFormatException ignored) {}

            Integer credits = 3;
            if (creditsVal != null && !creditsVal.isBlank()) {
                try { credits = Integer.parseInt(creditsVal.trim()); } catch (NumberFormatException ignored) {}
            }

            String cType = (courseType != null && !courseType.isBlank()) ? courseType.trim().toUpperCase() : "THEORY";

            try {
                if (curriculumRepository.existsByRegulationAndDepartmentIdAndSemesterAndSubjectId(
                    reg.trim(), deptOpt.get().getId(), semester, subOpt.get().getId())) {
                    // Update existing
                    Optional<Curriculum> currOpt = curriculumRepository.findByRegulationAndDepartmentIdAndSemesterAndSubjectId(
                        reg.trim(), deptOpt.get().getId(), semester, subOpt.get().getId());
                    if (currOpt.isPresent()) {
                        Curriculum c = currOpt.get();
                        c.setCredits(credits);
                        c.setCourseType(cType);
                        c.setActive(true);
                        curriculumRepository.save(c);
                    }
                } else {
                    Curriculum c = new Curriculum(reg.trim(), deptOpt.get(), semester, subOpt.get(), credits, cType);
                    curriculumRepository.save(c);
                }
                success++;
            } catch (Exception ex) {
                failed++;
                failures.add(new RowFailure(rowNum, subCode, "Curriculum save error: " + ex.getMessage()));
            }
        }

        return new SheetImportSummary(sheetName, total, success, failed, failures);
    }

    // -------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------
    private Sheet findSheet(Workbook wb, String... candidates) {
        for (String c : candidates) {
            Sheet s = wb.getSheet(c);
            if (s != null) return s;
        }
        for (int i = 0; i < wb.getNumberOfSheets(); i++) {
            Sheet s = wb.getSheetAt(i);
            for (String c : candidates) {
                if (s.getSheetName().equalsIgnoreCase(c)) return s;
            }
        }
        return null;
    }

    private List<String[]> readSheetRows(Sheet sheet) {
        List<String[]> list = new ArrayList<>();
        for (Row row : sheet) {
            int lastCell = Math.max(row.getLastCellNum(), 0);
            String[] cells = new String[lastCell];
            for (int i = 0; i < lastCell; i++) {
                Cell cell = row.getCell(i, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
                cells[i] = cell == null ? "" : dataFormatter.formatCellValue(cell).trim();
            }
            list.add(cells);
        }
        return list;
    }

    private List<String[]> parseFileRows(MultipartFile file) {
        if (file == null || file.isEmpty()) return List.of();
        String name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
        if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
            try (Workbook wb = WorkbookFactory.create(file.getInputStream())) {
                if (wb.getNumberOfSheets() > 0) {
                    return readSheetRows(wb.getSheetAt(0));
                }
            } catch (Exception ex) {
                throw new IllegalArgumentException("Failed to read Excel file: " + ex.getMessage());
            }
        } else {
            // CSV
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
                List<String[]> list = new ArrayList<>();
                String line;
                while ((line = reader.readLine()) != null) {
                    if (!line.isBlank()) {
                        list.add(line.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)", -1));
                    }
                }
                return list;
            } catch (Exception ex) {
                throw new IllegalArgumentException("Failed to read CSV file: " + ex.getMessage());
            }
        }
        return List.of();
    }

    private boolean isEmptyRow(String[] r) {
        if (r == null || r.length == 0) return true;
        for (String s : r) {
            if (s != null && !s.isBlank()) return false;
        }
        return true;
    }

    private Map<String, Integer> mapHeaders(String[] headers) {
        Map<String, Integer> map = new HashMap<>();
        if (headers == null) return map;
        for (int i = 0; i < headers.length; i++) {
            if (headers[i] != null) {
                String cleaned = headers[i].trim().toLowerCase(Locale.ROOT).replace(" ", "_").replace("-", "_");
                map.put(cleaned, i);
            }
        }
        return map;
    }

    private String readVal(String[] row, Map<String, Integer> map, String... keys) {
        for (String k : keys) {
            Integer idx = map.get(k.toLowerCase(Locale.ROOT));
            if (idx != null && idx < row.length) {
                String val = row[idx];
                if (val != null) {
                    val = val.trim();
                    if (val.startsWith("\"") && val.endsWith("\"") && val.length() >= 2) {
                        val = val.substring(1, val.length() - 1).trim();
                    }
                    if (!val.isBlank()) return val;
                }
            }
        }
        return null;
    }
}
