import { Subject } from '../types';
import { API_BASE_URL, getAuthHeaders } from './apiConfig';

function mapSubject(s: any): Subject {
  return {
    subject_code: s.subjectCode ?? s.subject_code,
    subject_name: s.subjectName ?? s.subject_name,
    description: s.description ?? '',
    credits: s.credits,
    is_active: (s.isActive ?? s.is_active) === 1 || (s.isActive ?? s.is_active) === true,
  };
}

function toBackend(s: Partial<Subject>): any {
  return {
    subjectCode: s.subject_code,
    subjectName: s.subject_name,
    isActive: s.is_active ? 1 : 0,
  };
}

export const subjectService = {
  async getSubjects(): Promise<Subject[]> {
    const res = await fetch(`${API_BASE_URL}/subjects`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch subjects');
    const data = await res.json();
    return (data as any[]).map(mapSubject);
  },

  async getSubjectByCode(code: string): Promise<Subject | undefined> {
    const res = await fetch(`${API_BASE_URL}/subjects/${code}`, {
      headers: getAuthHeaders(),
    });
    if (res.status === 404) return undefined;
    if (!res.ok) throw new Error('Failed to fetch subject');
    return mapSubject(await res.json());
  },

  async createSubject(subject: Subject): Promise<Subject> {
    const res = await fetch(`${API_BASE_URL}/subjects`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(toBackend(subject)),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to create subject');
    return mapSubject(data);
  },

  async updateSubject(code: string, updatedData: Partial<Subject>): Promise<Subject> {
    const res = await fetch(`${API_BASE_URL}/subjects/${code}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(toBackend(updatedData)),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to update subject');
    return mapSubject(data);
  },

  async deleteSubject(code: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/subjects/${code}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data?.message || 'Failed to delete subject');
    }
  },

  async toggleSubjectStatus(code: string): Promise<Subject> {
    const res = await fetch(`${API_BASE_URL}/subjects/${code}/toggle-status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to toggle subject status');
    return mapSubject(data);
  },
};
