import { Teacher } from '../types';
import { API_BASE_URL, getAuthHeaders } from './apiConfig';
import { authService } from './authService';

function mapTeacher(t: any): Teacher {
  return {
    teacher_id: t.teacherId ?? t.teacher_id,
    name: t.name,
    email: t.email ?? '',
    phone: t.phone ?? '',
    department: t.department,
    designation: t.designation,
    is_active: (t.isActive ?? t.is_active) === 1 || (t.isActive ?? t.is_active) === true,
  };
}

function toBackend(teacher: Partial<Teacher>): any {
  return {
    teacherId: teacher.teacher_id,
    name: teacher.name,
    isActive: teacher.is_active ? 1 : 0,
  };
}

export const teacherService = {
  async getTeachers(): Promise<Teacher[]> {
    const res = await fetch(`${API_BASE_URL}/teachers`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch teachers');
    const data = await res.json();
    return (data as any[]).map(mapTeacher);
  },

  async getTeacherById(id: string): Promise<Teacher | undefined> {
    const res = await fetch(`${API_BASE_URL}/teachers/${id}`, {
      headers: getAuthHeaders(),
    });
    if (res.status === 404) return undefined;
    if (!res.ok) throw new Error('Failed to fetch teacher');
    return mapTeacher(await res.json());
  },

  async createTeacher(
    teacher: Teacher,
    accountData?: { username: string; password: string; role: 'TEACHER' }
  ): Promise<Teacher> {
    const res = await fetch(`${API_BASE_URL}/teachers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(toBackend(teacher)),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to create teacher');

    // Register login account if credentials provided
    if (accountData?.username && accountData?.password) {
      await authService.registerUser({
        username: accountData.username,
        password: accountData.password,
        role: 'TEACHER',
        name: teacher.name,
        email: teacher.email,
        teacher_id: teacher.teacher_id,
        department: teacher.department,
        phone: teacher.phone,
      });
    }

    return mapTeacher(data);
  },

  async updateTeacher(id: string, updatedData: Partial<Teacher>): Promise<Teacher> {
    const res = await fetch(`${API_BASE_URL}/teachers/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(toBackend(updatedData)),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to update teacher');
    return mapTeacher(data);
  },

  async deleteTeacher(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/teachers/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data?.message || 'Failed to delete teacher');
    }
  },

  async toggleTeacherStatus(id: string): Promise<Teacher> {
    const res = await fetch(`${API_BASE_URL}/teachers/${id}/toggle-status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to toggle teacher status');
    return mapTeacher(data);
  },
};
