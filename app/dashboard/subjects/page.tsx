'use client';

import SubjectsManager from '../../components/dashboard/SubjectsManager';
import DashboardLayout from '../../components/dashboard/DashboardLayout';

export default function SubjectsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <SubjectsManager />
      </div>
    </DashboardLayout>
  );
}
