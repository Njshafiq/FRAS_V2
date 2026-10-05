import React, { useState } from 'react';
import { StudentSidebar } from './StudentSidebar';
import { Header } from './Header';
import { PageTransition } from '../common/PageTransition';

interface StudentLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const StudentLayout: React.FC<StudentLayoutProps> = ({ children, title, subtitle }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-150">
      <StudentSidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <PageTransition key={title}>
              {children}
            </PageTransition>
          </div>
        </main>
      </div>
    </div>
  );
};
