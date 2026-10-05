package com.college.attendance.service;

import com.college.attendance.dto.RowFailure;
import com.college.attendance.dto.TeacherImportResponse;
import com.college.attendance.model.Department;
import com.college.attendance.model.Role;
import com.college.attendance.model.Teacher;
import com.college.attendance.model.User;
import com.college.attendance.repository.DepartmentRepository;
import com.college.attendance.repository.TeacherRepository;
import com.college.attendance.repository.UserRepository;
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
import java.time.LocalDate;
import java.util.*;

@Service
public class TeacherImportService {

    private static final Logger log = LoggerFactory.getLogger(TeacherImportService.class);
    private final DataFormatter dataFormatter = new DataFormatter();

    private final TeacherRepository teacherRepository;
    private final DepartmentRepository departmentRepository;
    private final UserService userService;
    private final UserRepository userRepository;
    private final AdminAuditLogService auditLogService;

    public TeacherImportService(TeacherRepository teacherRepository,
                                DepartmentRepository departmentRepository,
                                UserService userService,
                                UserRepository userRepository,
                                AdminAuditLogService auditLogService) {
        this.teacherRepository = teacherRepository;
        this.departmentRepository = departmentRepository;
        this.userService = userService;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public TeacherImportResponse importTeachers(MultipartFile file, String adminUsername) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Import file is required.");
        }

        String filename = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
        if (!filename.endsWith(".csv") && !filename.endsWith(".xlsx") && !filename.endsWith(".xls")) {
            throw new IllegalArgumentException("Only CSV and XLS/XLSX teacher files are supported.");
        }

        List<String[]> rows = filename.endsWith(".csv") ? parseCsv(file) : parseExcel(file);
        if (rows.isEmpty()) {
            return new TeacherImportResponse(0, 0, 0, List.of(), "No teacher rows found in the uploaded file.");
        }

        Map<String, Integer> map = mapHeaders(rows.getFirst());
        int importedCount = 0;
        int skippedCount = 0;
        int totalRows = 0;
        List<RowFailure> failures = new ArrayList<>();

        for (int i = 1; i < rows.size(); i++) {
            String[] row = rows.get(i);
            if (isEmptyRow(row)) continue;
            totalRows++;
            int rowNum = i + 1;

            String teacherId = readVal(row, map, "teacher_id", "teacherid", "employee_id", "id");
            String name = readVal(row, map, "name", "teacher_name", "fullname");
            String deptVal = readVal(row, map, "department", "department_code", "dept_code", "department_id");
            String email = readVal(row, map, "email", "mail");
            String hireDateVal = readVal(row, map, "hire_date", "hiredate");

            if (teacherId == null || teacherId.isBlank() || name == null || name.isBlank() || deptVal == null || deptVal.isBlank()) {
                skippedCount++;
                failures.add(new RowFailure(rowNum, teacherId != null ? teacherId : "Row " + rowNum, "Missing required Teacher ID, Name, or Department"));
                continue;
            }

            if (teacherRepository.existsById(teacherId.trim())) {
                skippedCount++;
                failures.add(new RowFailure(rowNum, teacherId, "Duplicate Teacher ID: " + teacherId));
                continue;
            }

            Department department = null;
            try {
                Long dId = Long.parseLong(deptVal.trim());
                department = departmentRepository.findById(dId).orElse(null);
            } catch (NumberFormatException ignored) {}
            if (department == null) {
                department = departmentRepository.findByDepartmentCode(deptVal.trim()).orElse(null);
            }
            if (department == null) {
                skippedCount++;
                failures.add(new RowFailure(rowNum, teacherId, "Department not found: " + deptVal));
                continue;
            }

            String teacherEmail = email != null && !email.isBlank() ? email.trim() : (teacherId.trim().toLowerCase() + "@college.edu");
            if (userRepository.existsByEmail(teacherEmail) || userRepository.existsByUsername(teacherId.trim())) {
                skippedCount++;
                failures.add(new RowFailure(rowNum, teacherId, "Username or Email already registered: " + teacherEmail));
                continue;
            }

            LocalDate hireDate = LocalDate.now();
            if (hireDateVal != null && !hireDateVal.isBlank()) {
                try {
                    hireDate = LocalDate.parse(hireDateVal.trim());
                } catch (Exception ignored) {}
            }

            try {
                User user = userService.createUser(
                    teacherId.trim(),
                    "secret123",
                    name.trim(),
                    teacherEmail,
                    Role.TEACHER
                );

                Teacher teacher = new Teacher(teacherId.trim(), name.trim(), department);
                teacher.setEmail(teacherEmail);
                teacher.setHireDate(hireDate);
                teacher.setActive(true);
                teacher.setUser(user);

                teacherRepository.save(teacher);
                importedCount++;
            } catch (Exception ex) {
                skippedCount++;
                failures.add(new RowFailure(rowNum, teacherId, "Failed to save: " + ex.getMessage()));
            }
        }

        auditLogService.logAction(
            adminUsername,
            "IMPORT_TEACHERS",
            "TEACHER",
            filename,
            "Imported " + importedCount + " teachers, skipped " + skippedCount,
            null
        );

        String message = String.format("Import completed. Total rows: %d, Imported: %d, Skipped/Failed: %d.",
            totalRows, importedCount, skippedCount);

        return new TeacherImportResponse(importedCount, skippedCount, totalRows, failures, message);
    }

    private List<String[]> parseCsv(MultipartFile file) {
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
            throw new IllegalArgumentException("Failed to parse CSV: " + ex.getMessage());
        }
    }

    private List<String[]> parseExcel(MultipartFile file) {
        try (Workbook wb = WorkbookFactory.create(file.getInputStream())) {
            List<String[]> list = new ArrayList<>();
            if (wb.getNumberOfSheets() == 0) return list;
            Sheet sheet = wb.getSheetAt(0);
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
        } catch (Exception ex) {
            throw new IllegalArgumentException("Failed to parse Excel: " + ex.getMessage());
        }
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
