import { TimetableEntry, DayOfWeek } from '../types';
import { API_BASE_URL, getAuthHeaders } from './apiConfig';

function mapEntry(e: any): TimetableEntry {
  return {
    id: e.id,
    class_id: e.classId ?? e.class_id,
    class_name: e.className ?? e.class_name,
    subject_code: e.subjectCode ?? e.subject_code,
    subject_name: e.subjectName ?? e.subject_name,
    teacher_id: e.teacherId ?? e.teacher_id,
    teacher_name: e.teacherName ?? e.teacher_name,
    day_of_week: (e.dayOfWeek ?? e.day_of_week) as DayOfWeek,
    start_time: e.startTime ?? e.start_time,
    end_time: e.endTime ?? e.end_time,
    room_number: e.roomNumber ?? e.room_number,
  };
}

function toBackend(e: Partial<TimetableEntry>): any {
  return {
    classId: e.class_id,
    className: e.class_name,
    subjectCode: e.subject_code,
    subjectName: e.subject_name,
    teacherId: e.teacher_id,
    teacherName: e.teacher_name,
    dayOfWeek: e.day_of_week,
    startTime: e.start_time,
    endTime: e.end_time,
    roomNumber: e.room_number,
  };
}

export const timetableService = {
  async getTimetable(): Promise<TimetableEntry[]> {
    const res = await fetch(`${API_BASE_URL}/timetable`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch timetable');
    const data = await res.json();
    return (data as any[]).map(mapEntry);
  },

  async getTimetableByTeacher(teacherId: string): Promise<TimetableEntry[]> {
    const res = await fetch(`${API_BASE_URL}/timetable/teacher/${teacherId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch teacher timetable');
    const data = await res.json();
    return (data as any[]).map(mapEntry);
  },

  async getTimetableByClass(classId: string): Promise<TimetableEntry[]> {
    const res = await fetch(`${API_BASE_URL}/timetable/class/${classId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch class timetable');
    const data = await res.json();
    return (data as any[]).map(mapEntry);
  },

  async getTimetableById(id: number): Promise<TimetableEntry | undefined> {
    const res = await fetch(`${API_BASE_URL}/timetable/${id}`, {
      headers: getAuthHeaders(),
    });
    if (res.status === 404) return undefined;
    if (!res.ok) throw new Error('Failed to fetch timetable entry');
    return mapEntry(await res.json());
  },

  async createTimetableEntry(entry: Omit<TimetableEntry, 'id'>): Promise<TimetableEntry> {
    const res = await fetch(`${API_BASE_URL}/timetable`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(toBackend(entry)),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to create timetable entry');
    return mapEntry(data);
  },

  async updateTimetableEntry(id: number, updatedData: Partial<TimetableEntry>): Promise<TimetableEntry> {
    const res = await fetch(`${API_BASE_URL}/timetable/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(toBackend(updatedData)),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to update timetable entry');
    return mapEntry(data);
  },

  async deleteTimetableEntry(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/timetable/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data?.message || 'Failed to delete timetable entry');
    }
  },
};
