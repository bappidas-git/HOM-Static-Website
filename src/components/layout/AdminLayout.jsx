import React, { useState, useMemo } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  IconButton,
  Collapse,
  useMediaQuery,
  useTheme,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import { Icon } from '@iconify/react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { leadService } from '../../services/api';
import styles from './AdminLayout.module.css';

// Sidebar navigation config
const navItems = [
  {
    label: 'Dashboard',
    icon: 'mdi:view-dashboard-outline',
    path: '/admin/dashboard',
  },
  {
    label: 'Properties',
    icon: 'mdi:home-city-outline',
    children: [
      { label: 'All Properties', path: '/admin/properties' },
      { label: 'Add New', path: '/admin/properties/add' },
    ],
  },
  {
    label: 'Leads',
    icon: 'mdi:account-group-outline',
    path: '/admin/leads',
    badge: true,
  },
  {
    label: 'Articles',
    icon: 'mdi:newspaper-variant-outline',
    children: [
      { label: 'All Articles', path: '/admin/articles' },
      { label: 'Add New', path: '/admin/articles/add' },
    ],
  },
  {
    label: 'SEO Manager',
    icon: 'mdi:magnify',
    path: '/admin/seo',
  },
  {
    label: 'FAQs',
    icon: 'mdi:help-circle-outline',
    path: '/admin/faqs',
  },
  {
    label: 'Site Settings',
    icon: 'mdi:cog-outline',
    path: '/admin/settings',
  },
];

// Page title mapping
const pageTitles = {
  '/admin/dashboard': 'Dashboard',
  '/admin/properties': 'Properties',
  '/admin/properties/add': 'Add Property',
  '/admin/leads': 'Leads',
  '/admin/articles': 'Articles',
  '/admin/articles/add': 'Add Article',
  '/admin/seo': 'SEO Manager',
  '/admin/faqs': 'FAQs',
  '/admin/settings': 'Site Settings',
};

const AdminLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAdminAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [newLeadCount, setNewLeadCount] = useState(0);

  // Fetch new lead count
  React.useEffect(() => {
    const fetchLeadCount = async () => {
      try {
        const leads = await leadService.getAll({ status: 'new' });
        setNewLeadCount(Array.isArray(leads) ? leads.length : 0);
      } catch {
        setNewLeadCount(0);
      }
    };
    fetchLeadCount();
  }, []);

  // Current page title
  const pageTitle = useMemo(() => {
    const path = location.pathname;
    // Check for exact match first
    if (pageTitles[path]) return pageTitles[path];
    // Check for partial match (e.g., edit pages)
    if (path.includes('/admin/properties/edit')) return 'Edit Property';
    if (path.includes('/admin/leads/')) return 'Lead Detail';
    return 'Admin Panel';
  }, [location.pathname]);

  const toggleExpand = (label) => {
    setExpandedItems((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (path) => location.pathname === path;
  const isParentActive = (children) =>
    children?.some((child) => location.pathname.startsWith(child.path));

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'A';

  const handleLogout = () => {
    setProfileAnchor(null);
    logout();
    navigate('/admin/login');
  };

  // Sidebar content (shared between desktop and mobile drawer)
  const renderNavItems = (items) =>
    items.map((item) => {
      const hasChildren = item.children && item.children.length > 0;
      const expanded = expandedItems[item.label] || isParentActive(item.children);
      const active = hasChildren ? isParentActive(item.children) : isActive(item.path);

      return (
        <div key={item.label} className={styles.navSection}>
          {hasChildren ? (
            <>
              <div
                className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                onClick={() => toggleExpand(item.label)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && toggleExpand(item.label)}
              >
                <span className={styles.navIcon}>
                  <Icon icon={item.icon} />
                </span>
                {(!collapsed || isMobile) && (
                  <>
                    <span className={styles.navLabel}>{item.label}</span>
                    <span
                      className={`${styles.navExpandIcon} ${
                        expanded ? styles.navExpandIconOpen : ''
                      }`}
                    >
                      <Icon icon="mdi:chevron-down" />
                    </span>
                  </>
                )}
              </div>
              {(!collapsed || isMobile) && (
                <Collapse in={expanded} timeout="auto" unmountOnExit>
                  <div className={styles.navSubItems}>
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={`${styles.navSubItem} ${
                          isActive(child.path) ? styles.navSubItemActive : ''
                        }`}
                        onClick={() => isMobile && setMobileOpen(false)}
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                </Collapse>
              )}
            </>
          ) : (
            <NavLink
              to={item.path}
              className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
              onClick={() => isMobile && setMobileOpen(false)}
            >
              <span className={styles.navIcon}>
                <Icon icon={item.icon} />
              </span>
              {(!collapsed || isMobile) && (
                <>
                  <span className={styles.navLabel}>{item.label}</span>
                  {item.badge && newLeadCount > 0 && (
                    <span className={styles.navBadge}>{newLeadCount}</span>
                  )}
                </>
              )}
            </NavLink>
          )}
        </div>
      );
    });

  const sidebarContent = (mobile = false) => (
    <>
      {/* Brand */}
      <div className={styles.sidebarBrand}>
        <div className={styles.brandLogo}>
          <Icon icon="mdi:home-city" style={{ fontSize: 20, color: '#C9A86C' }} />
        </div>
        {(!collapsed || mobile) && (
          <div className={styles.brandText}>
            <div className={styles.brandTitle}>H.O.M Advisory</div>
            <div className={styles.brandSubtitle}>Admin Panel</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className={mobile ? styles.mobileDrawerNav : styles.sidebarNav}>
        {(!collapsed || mobile) && (
          <div className={styles.navSectionLabel}>Main Menu</div>
        )}
        {renderNavItems(navItems)}
      </div>

      {/* Footer */}
      <div className={mobile ? styles.mobileDrawerFooter : styles.sidebarFooter}>
        <div className={styles.userCard}>
          <div className={styles.userAvatar}>{userInitials}</div>
          {(!collapsed || mobile) && (
            <div className={styles.userInfo}>
              <div className={styles.userName}>{user?.name || 'Admin'}</div>
              <div className={styles.userRole}>{user?.role || 'admin'}</div>
            </div>
          )}
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout} type="button">
          <Icon icon="mdi:logout" style={{ fontSize: 18 }} />
          {(!collapsed || mobile) && <span>Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className={styles.adminRoot}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside
          className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}
        >
          {sidebarContent(false)}
        </aside>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': { width: 280, border: 'none' },
          }}
        >
          <div className={styles.mobileDrawer}>
            <div className={styles.mobileDrawerHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className={styles.brandLogo}>
                  <Icon icon="mdi:home-city" style={{ fontSize: 20, color: '#C9A86C' }} />
                </div>
                <div>
                  <div className={styles.brandTitle}>H.O.M Advisory</div>
                  <div className={styles.brandSubtitle}>Admin Panel</div>
                </div>
              </div>
              <IconButton onClick={() => setMobileOpen(false)} size="small">
                <Icon icon="mdi:close" />
              </IconButton>
            </div>
            {sidebarContent(true)}
          </div>
        </Drawer>
      )}

      {/* Top Bar */}
      <header
        className={`${styles.topBar} ${
          !isMobile && collapsed ? styles.topBarCollapsed : ''
        }`}
      >
        <div className={styles.topBarLeft}>
          {isMobile ? (
            <button
              className={styles.collapseBtn}
              onClick={() => setMobileOpen(true)}
              type="button"
              aria-label="Open menu"
            >
              <Icon icon="mdi:menu" style={{ fontSize: 22 }} />
            </button>
          ) : (
            <button
              className={styles.collapseBtn}
              onClick={() => setCollapsed((prev) => !prev)}
              type="button"
              aria-label="Toggle sidebar"
            >
              <Icon
                icon={collapsed ? 'mdi:menu' : 'mdi:menu-open'}
                style={{ fontSize: 22 }}
              />
            </button>
          )}
          <span className={styles.pageTitle}>{pageTitle}</span>
        </div>

        <div className={styles.topBarRight}>
          <button className={styles.topBarIconBtn} type="button" aria-label="Notifications">
            <Icon icon="mdi:bell-outline" style={{ fontSize: 22 }} />
            {newLeadCount > 0 && <span className={styles.notificationDot} />}
          </button>

          <button
            className={styles.profileDropdown}
            type="button"
            onClick={(e) => setProfileAnchor(e.currentTarget)}
            aria-label="Profile menu"
          >
            <div className={styles.profileAvatar}>{userInitials}</div>
            {!isMobile && (
              <span className={styles.profileName}>{user?.name || 'Admin'}</span>
            )}
            <Icon icon="mdi:chevron-down" style={{ fontSize: 16, color: '#9CA3AF' }} />
          </button>

          <Menu
            anchorEl={profileAnchor}
            open={Boolean(profileAnchor)}
            onClose={() => setProfileAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: { width: 200, mt: 1, borderRadius: 2 },
            }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Box sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1B2A4A' }}>
                {user?.name || 'Admin'}
              </Box>
              <Box sx={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                {user?.email || 'admin@homadvisory.com'}
              </Box>
            </Box>
            <Divider />
            <MenuItem
              onClick={() => {
                setProfileAnchor(null);
                navigate('/admin/settings');
              }}
            >
              <ListItemIcon>
                <Icon icon="mdi:cog-outline" style={{ fontSize: 18 }} />
              </ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: '0.875rem' }}>
                Settings
              </ListItemText>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Icon icon="mdi:logout" style={{ fontSize: 18, color: '#EF4444' }} />
              </ListItemIcon>
              <ListItemText
                primaryTypographyProps={{ fontSize: '0.875rem', color: '#EF4444' }}
              >
                Logout
              </ListItemText>
            </MenuItem>
          </Menu>
        </div>
      </header>

      {/* Main Content */}
      <main
        className={`${styles.mainContent} ${
          !isMobile && collapsed ? styles.mainContentCollapsed : ''
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
