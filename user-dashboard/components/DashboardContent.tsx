import React from 'react';
import WelcomeHeader from './WelcomeHeader';
import KPICards from './KPICards';
import ModuleAccessGrid from './ModuleAccessGrid';
import NotificationsPanel from './NotificationsPanel';
import OrganizationsPanel from './OrganizationsPanel';
import ActivityLog from './ActivityLog';

export default function DashboardContent() {
  return (
    <div className="max-w-screen-2xl mx-auto px-4 lg:px-6 xl:px-8 2xl:px-12 py-6 lg:py-8 flex flex-col gap-8">
      <WelcomeHeader />
      <KPICards />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 2xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 flex flex-col gap-6">
          <ModuleAccessGrid />
          <ActivityLog />
        </div>
        <div className="flex flex-col gap-6">
          <NotificationsPanel />
          <OrganizationsPanel />
        </div>
      </div>
    </div>
  );
}