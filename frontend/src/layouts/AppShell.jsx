import { useState, useCallback, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import s from './AppShell.module.css';

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleMenuClick = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <div id="app">
      <Sidebar isOpen={sidebarOpen} onClose={handleCloseSidebar} />

      {/* Mobile overlay */}
      <div
        className={`${s.mobOverlay} ${sidebarOpen ? s.mobOverlayOpen : ''}`}
        onClick={handleCloseSidebar}
        aria-hidden="true"
      />

      <div className={s.main}>
        <Topbar onMenuClick={handleMenuClick} notificationCount={3} />
        <div className={s.contentScroll}>
          <div className={s.page}>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
