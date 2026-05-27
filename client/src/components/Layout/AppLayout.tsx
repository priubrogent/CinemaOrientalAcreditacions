import { useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import type { AccreditationType } from '../../types';

export default function AppLayout() {
  const { type } = useParams<{ type: AccreditationType }>();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className="app-shell"
      data-current-type={type ?? undefined}
    >
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
