export interface NavigationItem {
  id: string;
  title: string;
  type: 'item' | 'collapse' | 'group';
  translate?: string;
  icon?: string;
  hidden?: boolean;
  url?: string;
  classes?: string;
  groupClasses?: string;
  exactMatch?: boolean;
  external?: boolean;
  target?: boolean;
  breadcrumbs?: boolean;
  children?: NavigationItem[];
  link?: string;
  description?: string;
  path?: string;
}

export const NavigationItems: NavigationItem[] = [


  {
    id: 'utilities',
    title: 'TENANCY',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        type: 'item',
        classes: 'nav-item',
        url: '/dashboard/default',
        icon: 'dashboard',
        breadcrumbs: false
      },
      {
        id: 'property-setup',
        title: 'Property Setup',
        type: 'item',
        classes: 'nav-item',
        url: '/property/setup',
        icon: 'home',
        breadcrumbs: false
      },
      {
        id: 'services',
        title: 'Services',
        type: 'item',
        classes: 'nav-item',
        url: '/services',
        icon: 'tool',
        breadcrumbs: false
      },
      {
        id: 'user-management',
        title: 'User Management',
        type: 'collapse',
        icon: 'team',
        children: [
          {
            id: 'users',
            title: 'Users',
            type: 'item',
            url: '/user-management/users',
            classes: 'nav-item',
            icon: 'user',
            breadcrumbs: false
          },
          {
            id: 'document-number',
            title: 'Document Number',
            type: 'item',
            url: '/user-management/document-number',
            classes: 'nav-item',
            icon: 'file-text',
            breadcrumbs: false
          },
          {
            id: 'company-email',
            title: 'Company Email',
            type: 'item',
            url: '/user-management/company-email',
            classes: 'nav-item',
            icon: 'mail',
            breadcrumbs: false
          },
          {
            id: 'security-groups',
            title: 'Security Groups',
            type: 'item',
            url: '/user-management/security-groups',
            classes: 'nav-item',
            icon: 'safety-certificate',
            breadcrumbs: false
          }
        ]
      },
      {
        id: 'reminders',
        title: 'Reminders',
        type: 'collapse',
        icon: 'bell',
        children: [
          {
            id: 'reminder-settings',
            title: 'Reminder Settings',
            type: 'item',
            url: '/reminders/settings',
            classes: 'nav-item',
            icon: 'setting',
            breadcrumbs: false
          },
          {
            id: 'reminder-run',
            title: 'Run Reminder',
            type: 'item',
            url: '/reminders/run',
            classes: 'nav-item',
            icon: 'play-circle',
            breadcrumbs: false
          },
          {
            id: 'month-expiry',
            title: '3 Month Expiry',
            type: 'item',
            url: '/reminders/expiry',
            classes: 'nav-item',
            icon: 'calendar',
            breadcrumbs: false
          }
        ]
      },
      {
        id: 'email-management',
        title: 'Email Management',
        type: 'collapse',
        icon: 'mail',
        children: [
          {
            id: 'email-templates',
            title: 'Email Templates',
            type: 'item',
            url: '/reminders/email-templates',
            classes: 'nav-item',
            icon: 'file-text',
            breadcrumbs: false
          },
          {
            id: 'log-emails',
            title: 'Log Emails',
            type: 'item',
            url: '/reminders/log-emails',
            classes: 'nav-item',
            icon: 'history',
            breadcrumbs: false
          }
        ]
      },
      {
        id: 'announcement',
        title: 'Announcement',
        type: 'item',
        url: '/announcement',
        classes: 'nav-item',
        icon: 'sound',
        breadcrumbs: false
      }
    ]
  }
];