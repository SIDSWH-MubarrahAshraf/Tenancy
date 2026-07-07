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
          }
        ]
      }
    ]
  }
];