package com.college.attendance.service;

import com.college.attendance.dto.StudentImportResponse;
import com.college.attendance.model.AcademicYear;
import com.college.attendance.model.ClassEntity;
import com.college.attendance.model.Student;
import com.college.attendance.repository.AcademicYearRepository;
import com.college.attendance.repository.ClassEntityRepository;
import com.college.attendance.repository.StudentRepository;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

@Service
public class StudentImportService {

    private final StudentRepository studentRepository;
    private final ClassEntityRepository classEntityRepository;
    private final AcademicYearRepository academicYearRepository;
    private final UserService userService;

    public StudentImportService(StudentRepository studentRepository,
                               ClassEntityRepository classEntityRepository,
                               AcademicYearRepository academicYearRepository,
                               UserService userService) {
        this.studentRepository = studentRepository;
        this.classEntityRepository = classEntityRepository;
        this.academicYearRepository = academicYearRepository;
        this.userService = userService;
    }

    public StudentImportResponse importStudents(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Import file is required.");
        }

        String filename = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
        if (!filename.endsWith(".csv") && !filename.endsWith(".xlsx") && !filename.endsWith(".xls")) {
            throw new IllegalArgumentException("Only CSV and XLS/XLSX student files are supported.");
        }

        List<String[]> rows = filename.endsWith(".csv")
            ? parseCsv(file)
            : parseExcel(file);

        if (rows.isEmpty()) {
            return new StudentImportResponse(0, 0, 0, "No student rows found in the uploaded file.");
        }

        int importedCount = 0;
        int skippedCount = 0;
        int totalRows = 0;

        String[] headers = rows.getFirst();
        Map<String, Integer> indexMap = mapHeaders(headers);

        for (int i = 1; i < rows.size(); i++) {
            String[] row = rows.get(i);
            if (row == null || row.length == 0) {
                continue;
            }
            totalRows++;

            String studentId = readValue(row, indexMap, "studentid", "student_id");
            String name = readValue(row, indexMap, "name");
            String registerNumber = readValue(row, indexMap, "registernumber", "register_number");
            String classIdValue = readValue(row, indexMap, "classid", "class_id", "classcode", "class_code", "classname", "class_name");
            String academicYearIdValue = readValue(row, indexMap, "academicyearid", "academic_year_id", "academicyear", "academic_year");

            if (studentId == null || studentId.isBlank() || name == null || name.isBlank() || registerNumber == null || registerNumber.isBlank()) {
                skippedCount++;
                continue;
            }

            if (studentRepository.existsByStudentId(studentId.trim())) {
                skippedCount++;
                continue;
            }

            ClassEntity classEntity;
            if (classIdValue != null && !classIdValue.isBlank()) {
                try {
                    Long classId = Long.parseLong(classIdValue.trim());
                    classEntity = classEntityRepository.findById(classId)
                        .orElseThrow(() -> new IllegalArgumentException("Class not found with id: " + classId));
                } catch (NumberFormatException ex) {
                    classEntity = classEntityRepository.findByClassCode(classIdValue.trim())
                        .orElseGet(() -> classEntityRepository.findAll().stream()
                            .filter(item -> item.getClassName().equalsIgnoreCase(classIdValue.trim()))
                            .findFirst()
                            .orElseThrow(() -> new IllegalArgumentException("Class not found: " + classIdValue)));
                }
            } else {
                throw new IllegalArgumentException("Class information is required for student " + studentId);
            }

            AcademicYear academicYear;
            if (academicYearIdValue != null && !academicYearIdValue.isBlank()) {
                try {
                    Long academicYearId = Long.parseLong(academicYearIdValue.trim());
                    academicYear = academicYearRepository.findById(academicYearId)
                        .orElseThrow(() -> new IllegalArgumentException("Academic year not found with id: " + academicYearId));
                } catch (NumberFormatException ex) {
                    academicYear = academicYearRepository.findAll().stream()
                        .filter(item -> item.getYearName().equalsIgnoreCase(academicYearIdValue.trim()))
                        .findFirst()
                        .orElseThrow(() -> new IllegalArgumentException("Academic year not found: " + academicYearIdValue));
                }
            } else {
                academicYear = classEntity.getAcademicYear();
            }

            Student student = new Student(studentId.trim(), name.trim(), registerNumber.trim(), classEntity, academicYear);
            student.setGender(readValue(row, indexMap, "gender"));
            student.setPhone(readValue(row, indexMap, "phone"));
            student.setEmail(readValue(row, indexMap, "email"));
            student.setActive(parseBoolean(readValue(row, indexMap, "active", "is_active"), true));

            String dateOfBirthValue = readValue(row, indexMap, "dateofbirth", "date_of_birth");
            if (dateOfBirthValue != null && !dateOfBirthValue.isBlank()) {
                student.setDateOfBirth(LocalDate.parse(dateOfBirthValue.trim()));
            }

            String enrollmentDateValue = readValue(row, indexMap, "enrollmentdate", "enrollment_date");
            if (enrollmentDateValue != null && !enrollmentDateValue.isBlank()) {
                student.setEnrollmentDate(LocalDate.parse(enrollmentDateValue.trim()));
            }

            com.college.attendance.model.User user = userService.findByUsername(studentId.trim())
                .orElseGet(() -> userService.createUser(
                    studentId.trim(),
                    "student123",
                    name.trim(),
                    student.getEmail() != null && !student.getEmail().isBlank() ? student.getEmail() : studentId.trim() + "@student.college.edu",
                    com.college.attendance.model.Role.STUDENT
                ));
            student.setUser(user);

            studentRepository.save(student);
            importedCount++;
        }

        return new StudentImportResponse(importedCount, skippedCount, totalRows, "Imported " + importedCount + " student records.");
    }

    private List<String[]> parseCsv(MultipartFile file) {
        List<String[]> rows = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) {
                    continue;
                }
                rows.add(line.split(",", -1));
            }
        } catch (Exception ex) {
            throw new IllegalArgumentException("Unable to parse CSV file: " + ex.getMessage(), ex);
        }
        return rows;
    }

    private List<String[]> parseExcel(MultipartFile file) {
        List<String[]> rows = new ArrayList<>();
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            for (Row row : sheet) {
                List<String> values = new ArrayList<>();
                for (int i = 0; i <= row.getLastCellNum(); i++) {
                    var cell = row.getCell(i, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
                    values.add(cell == null ? "" : switch (cell.getCellType()) {
                        case STRING -> cell.getStringCellValue();
                        case NUMERIC -> String.valueOf(cell.getNumericCellValue());
                        case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
                        default -> "";
                    });
                }
                rows.add(values.toArray(new String[0]));
            }
        } catch (Exception ex) {
            throw new IllegalArgumentException("Unable to parse Excel file: " + ex.getMessage(), ex);
        }
        return rows;
    }

    private Map<String, Integer> mapHeaders(String[] headers) {
        Map<String, Integer> indexMap = new java.util.HashMap<>();
        for (int i = 0; i < headers.length; i++) {
            String key = normalizeHeader(headers[i]);
            if (!key.isBlank()) {
                indexMap.put(key, i);
            }
        }
        return indexMap;
    }

    private String readValue(String[] row, Map<String, Integer> indexMap, String... keys) {
        for (String key : keys) {
            Integer index = indexMap.get(normalizeHeader(key));
            if (index != null && index < row.length) {
                String value = row[index];
                if (value != null && !value.trim().isEmpty()) {
                    return value.trim();
                }
            }
        }
        return null;
    }

    private String normalizeHeader(String value) {
        if (value == null) {
            return "";
        }
        return value.replace(" ", "").replace("-", "").replace("_", "").toLowerCase(Locale.ROOT);
    }

    private boolean parseBoolean(String value, boolean defaultValue) {
        if (value == null || value.isBlank()) {
            return defaultValue;
        }
        return Boolean.parseBoolean(value.trim()) || "yes".equalsIgnoreCase(value.trim()) || "y".equalsIgnoreCase(value.trim()) || "1".equals(value.trim());
    }
}
