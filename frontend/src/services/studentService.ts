import { Student } from '../types';
import { API_BASE_URL, getAuthHeaders } from './apiConfig';
import { authService } from './authService';

// Map backend StudentEntity fields to frontend Student shape
function mapStudent(s: any): Student {
  return {
    student_id: s.studentId ?? s.student_id,
    name: s.name,
    class_id: s.classId ?? s.class_id ?? '',
    class_name: s.className ?? s.class_name,
    email: s.email ?? '',
    phone: s.phone ?? '',
    department: s.department,
    academic_year: s.academicYear ?? s.academic_year,
    section: s.section,
    is_active: (s.isActive ?? s.is_active) === 1 || (s.isActive ?? s.is_active) === true,
    face_registered: s.faceRegistered ?? s.face_registered ?? false,
    created_at: s.createdAt ?? s.created_at,
  };
}

function toBackend(student: Partial<Student>): any {
  return {
    studentId: student.student_id,
    name: student.name,
    classId: student.class_id,
    isActive: student.is_active ? 1 : 0,
  };
}

export const studentService = {
  async getStudents(): Promise<Student[]> {
    const res = await fetch(`${API_BASE_URL}/students`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch students');
    const data = await res.json();
    return (data as any[]).map(mapStudent);
  },

  async getStudentById(id: string): Promise<Student | undefined> {
    const res = await fetch(`${API_BASE_URL}/students/${id}`, {
      headers: getAuthHeaders(),
    });
    if (res.status === 404) return undefined;
    if (!res.ok) throw new Error('Failed to fetch student');
    return mapStudent(await res.json());
  },

  async createStudent(
    student: Omit<Student, 'created_at'>,
    accountData?: { username: string; password: string; role: 'STUDENT' }
  ): Promise<Student> {
    const res = await fetch(`${API_BASE_URL}/students`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(toBackend(student)),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to create student');
    const created = mapStudent(data);

    // Register login account if credentials provided
    if (accountData?.username && accountData?.password) {
      await authService.registerUser({
        username: accountData.username,
        password: accountData.password,
        role: 'STUDENT',
        name: student.name,
        email: student.email,
        student_id: student.student_id,
        class_id: student.class_id,
        class_name: student.class_name,
        department: student.department || 'Computer Science',
        phone: student.phone,
      });
    }

    return created;
  },

  async updateStudent(id: string, updatedData: Partial<Student>): Promise<Student> {
    const res = await fetch(`${API_BASE_URL}/students/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(toBackend(updatedData)),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to update student');
    return mapStudent(data);
  },

  async deleteStudent(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/students/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data?.message || 'Failed to delete student');
    }
  },

  async toggleStudentStatus(id: string): Promise<Student> {
    const res = await fetch(`${API_BASE_URL}/students/${id}/toggle-status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to toggle student status');
    return mapStudent(data);
  },
};
