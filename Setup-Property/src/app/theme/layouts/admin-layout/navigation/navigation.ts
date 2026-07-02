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
  id: 'transactions',
  title: 'Transactions',
  type: 'group',
  icon: 'file-text',
  children: [
    {
      id: 'invoice-entry',
      title: 'Invoice Management',
      type: 'item',
      url: '/invoice-entry'
    }
  ]
},
 {
  id: 'Contract',
  title: 'Contract',
  type: 'group',
  icon: 'file-text',
  children: [
    {
      id: 'receipt-entry',
      title: 'Receipt Entry',
      type: 'item',
      url: '/receipt-entry'
    },
    {
      id: 'recurring-entries',
      title: 'Recurring Entries',
      type: 'item',
      url: '/recurring-entries'
    }
  ]
},  
  {
    id: 'utilities',
    title: 'Setup',
    type: 'group',
    icon: 'icon-navigation',
    children: [
     {
  id: 'property-setup',
  title: 'Property Setup',
  type: 'item',
  classes: 'nav-item',
  url: '/property/setup',
  icon: 'setting',
  breadcrumbs: false
},
{
    id: 'services',
    title: 'Services',
    type: 'item',
    classes: 'nav-item',
    url: '/services',
    icon: 'setting',
    breadcrumbs: false
},
    ]
  }

];
