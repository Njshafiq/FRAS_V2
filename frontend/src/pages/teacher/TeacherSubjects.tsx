import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TeacherLayout } from '../../components/layout/TeacherLayout';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import {
  BookOpen,
  School,
  PlayCircle,
  AlertCircle,
  Award,
  Layers,
  Search,
} from 'lucide-react';
import { teacherApi, TeacherSubjectAssignment } from '../../services/teacherApi';

export const TeacherSubjects: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<TeacherSubjectAssignment[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await teacherApi.getMySubjects();
      setSubjects(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load assigned subjects');
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter(
    (s) =>
      (s.subjectName || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.subjectCode || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.className || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <TeacherLayout
      title="My Subjects"
      subtitle="View courses you instruct, curriculum codes, and launch class sessions"
    >
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
          <button
            onClick={loadSubjects}
            className="ml-auto underline font-medium text-xs hover:text-rose-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* Action Header & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by subject name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 shadow-sm"
          />
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-1 self-end sm:self-center">
          Total Assigned: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{subjects.length}</strong>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-44 bg-slate-100 dark:bg-slate-800/60 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : filteredSubjects.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
            {search ? 'No matching subjects found' : 'No subjects assigned yet'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search
              ? 'Try refining your search keyword.'
              : 'You have not been assigned to instruct any subject courses yet. Contact your department administrator if this is unexpected.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSubjects.map((sub) => (
            <Card
              key={sub.id}
              className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow border-slate-200/80 dark:border-slate-800"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  {sub.credits !== undefined && (
                    <Badge variant="default" size="sm" className="font-medium">
                      <Award className="w-3 h-3 mr-1" />
                      {sub.credits} Credits
                    </Badge>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                  {sub.subjectName || `Subject #${sub.subjectId}`}
                </h3>
                <p className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {sub.subjectCode || 'CODE PENDING'}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <School className="w-3.5 h-3.5 text-slate-400" /> Class
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {sub.className || (sub.classId ? `Class #${sub.classId}` : 'All Sections')}
                    </span>
                  </div>

                  {sub.classCode && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-slate-400" /> Class Code
                      </span>
                      <span className="font-mono text-slate-600 dark:text-slate-300">
                        {sub.classCode}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <Button
                  variant="primary"
                  className="w-full text-xs py-2 justify-center"
                  icon={PlayCircle}
                  onClick={() =>
                    navigate(
                      `/teacher/attendance?subjectId=${sub.subjectId}${
                        sub.classId ? `&classId=${sub.classId}` : ''
                      }`
                    )
                  }
                >
                  Start Attendance
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </TeacherLayout>
  );
};
