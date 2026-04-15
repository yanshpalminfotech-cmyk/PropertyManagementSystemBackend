import React from 'react';
import { Layout, Menu, Tag, Dropdown, Space, Typography } from 'antd';
import {
  HomeOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  LogoutOutlined,
  UserOutlined,
  MessageOutlined,
  SolutionOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types/enums';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const roleBadgeColor: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'red',
  [UserRole.BROKER]: 'orange',
  [UserRole.CUSTOMER]: 'blue',
};

/**
 * Main application layout with sidebar navigation filtered by role,
 * header with user info and logout, and content area.
 */
const AppLayout: React.FC = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Build menu items based on role
  const menuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      icon: <HomeOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/properties',
      icon: <AppstoreOutlined />,
      label: 'Properties',
    },
  ];

  // My Site Visits — Customer only
  if (role === UserRole.CUSTOMER) {
    menuItems.push({
      key: '/my-visits',
      icon: <CalendarOutlined />,
      label: 'My Site Visits',
    });
  }

  // Manage Users — Admin only
  if (role === UserRole.ADMIN) {
    menuItems.push({
      key: '/customers',
      icon: <UserOutlined />,
      label: 'Customers',
    });
    menuItems.push({
      key: '/brokers',
      icon: <SolutionOutlined />,
      label: 'Brokers',
    });
  }


  // Manage Visits — Admin & Broker

  if (role === UserRole.ADMIN || role === UserRole.BROKER) {
    menuItems.push({
      key: '/visit-management',
      icon: <CalendarOutlined />,
      label: 'Manage Visits',
    });
    menuItems.push({
      key: '/feedback',
      icon: <MessageOutlined />,
      label: 'Feedback',
    });
  }

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        breakpoint="lg"
        collapsedWidth="80"
        style={{ background: '#fff' }}
      >
        <div style={{ padding: '16px', textAlign: 'center', fontWeight: 700, fontSize: 18 }}>
          SuratPropertyHub
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <div />
          <Space size="middle">
            {role && <Tag color={roleBadgeColor[role]}>{role}</Tag>}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <UserOutlined />
                <Text>{user?.name}</Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: '24px', background: '#fff', padding: 24, borderRadius: 8 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
