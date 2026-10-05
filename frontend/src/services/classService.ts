import { ClassEntity } from '../types';
import { API_BASE_URL, getAuthHeaders } from './apiConfig';

function mapClass(c: any): ClassEntity {
  return {
    class_id: c.classId ?? c.class_id,
    class_name: c.className ?? c.class_name,
    section: c.section ?? '',
    academic_year: c.academicYear ?? c.academic_year ?? '',
    student_count: c.studentCount ?? c.student_count ?? 0,
    is_active: (c.isActive ?? c.is_active) !== 0 && (c.isActive ?? c.is_active) !== false,
    department: c.department,
  };
}

function toBackend(c: Partial<ClassEntity>): any {
  return {
    classId: c.class_id,
    className: c.class_name,
  };
}

export const classService = {
  async getClasses(): Promise<ClassEntity[]> {
    const res = await fetch(`${API_BASE_URL}/classes`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch classes');
    const data = await res.json();
    return (data as any[]).map(mapClass);
  },

  async getClassById(id: string): Promise<ClassEntity | undefined> {
    const res = await fetch(`${API_BASE_URL}/classes/${id}`, {
      headers: getAuthHeaders(),
    });
    if (res.status === 404) return undefined;
    if (!res.ok) throw new Error('Failed to fetch class');
    return mapClass(await res.json());
  },

  async createClass(classItem: ClassEntity): Promise<ClassEntity> {
    const res = await fetch(`${API_BASE_URL}/classes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(toBackend(classItem)),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to create class');
    return mapClass(data);
  },

  async updateClass(id: string, updatedData: Partial<ClassEntity>): Promise<ClassEntity> {
    const res = await fetch(`${API_BASE_URL}/classes/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(toBackend(updatedData)),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to update class');
    return mapClass(data);
  },

  async deleteClass(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/classes/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data?.message || 'Failed to delete class');
    }
  },

  async toggleClassStatus(id: string): Promise<ClassEntity> {
    // No dedicated endpoint; fetch then update
    const current = await this.getClassById(id);
    if (!current) throw new Error('Class not found');
    return this.updateClass(id, { is_active: !current.is_active });
  },
};
