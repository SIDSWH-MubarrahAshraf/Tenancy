// angular import
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Project import
import { AdminLayout } from './theme/layouts/admin-layout/admin-layout.component';
import { GuestLayoutComponent } from './theme/layouts/guest-layout/guest-layout.component';

// Invoice Entry import

const routes: Routes = [
  {
    path: '',
    component: AdminLayout,
    children: [
      {
        path: '',
        redirectTo: '/login',
        pathMatch: 'full'
      },
      {
        path: 'dashboard/default',
        loadComponent: () =>
          import('./demo/dashboard/default/default.component').then((c) => c.DefaultComponent)
      },
      {
        path: 'typography',
        loadComponent: () =>
          import('./demo/component/basic-component/typography/typography.component').then((c) => c.TypographyComponent)
      },
      {
        path: 'color',
        loadComponent: () =>
          import('./demo/component/basic-component/color/color.component').then((c) => c.ColorComponent)
      },
      {
        path: 'sample-page',
        loadComponent: () =>
          import('./demo/others/sample-page/sample-page.component').then((c) => c.SamplePageComponent)
      },


      {
        path: 'property/setup',
        loadComponent: () =>
          import('./demo/pages/setup/setup.component').then((m) => m.SetupComponent),
        data: { title: 'Property Setup' }
      },
      {
        path: 'services',
        loadComponent: () =>
          import('./demo/pages/services/services.component').then((c) => c.ServicesComponent)
      },
      {
        path: 'blank',
        loadComponent: () =>
          import('./demo/pages/blank/blank.component').then((c) => c.BlankComponent)
      },
      {
  path: 'user-management',
  loadComponent: () =>
    import('./demo/pages/user-management/user-management.component')
      .then(c => c.UserManagementComponent),
  children: [
    {
      path: '',
      redirectTo: 'users',
      pathMatch: 'full'
    },
    {
      path: 'users',
      loadComponent: () =>
        import('./demo/pages/user-management/users/users.component')
          .then(c => c.UsersComponent)
    },
    {
      path: 'branch',
      loadComponent: () =>
        import('./demo/pages/user-management/branch/branch.component')
          .then(c => c.BranchComponent)
    },
    {
      path: 'department',
      loadComponent: () =>
        import('./demo/pages/user-management/department/department.component')
          .then(c => c.DepartmentComponent)
    },
    {
      path: 'designation',
      loadComponent: () =>
        import('./demo/pages/user-management/designation/designation.component')
          .then(c => c.DesignationComponent)
    },
    {
      path: 'document-number',
      loadComponent: () =>
        import('./demo/pages/user-management/document/document.component')
          .then(c => c.DocumentNumberComponent)
    },
    {
      path: 'company-email',
      redirectTo: 'email-setup',
      pathMatch: 'full'
    },
    {
      path: 'email-setup',
      loadComponent: () =>
        import('./demo/pages/user-management/email-setup/email-setup.component')
          .then(c => c.EmailSetupComponent)
    },
    {
      path: 'security-groups',
      loadComponent: () =>
        import('./demo/pages/user-management/security-group/security-group.component')
          .then(c => c.SecurityGroupComponent)
    }
  ]
},
      {
        path: 'reminders',
        loadComponent: () =>
          import('./demo/pages/reminders/reminders.component')
            .then(c => c.RemindersComponent),
        children: [
          {
            path: '',
            redirectTo: 'email-templates',
            pathMatch: 'full'
          },
          {
            path: 'email-templates',
            loadComponent: () =>
              import('./demo/pages/reminders/email-template/email-template.component')
                .then(c => c.EmailTemplateComponent)
          },
          {
            path: 'settings',
            loadComponent: () =>
              import('./demo/pages/reminders/reminder-setting/reminder-setting.component')
                .then(c => c.ReminderSettingComponent)
          },
          {
            path: 'run',
            loadComponent: () =>
              import('./demo/pages/reminders/reminder-run/reminder-run.component')
                .then(c => c.ReminderRunComponent)
          },
          {
            path: 'expiry',
            loadComponent: () =>
              import('./demo/pages/reminders/month-expiry/month-expiry.component')
                .then(c => c.MonthExpiryComponent)
          },
          {
            path: 'log-emails',
            loadComponent: () =>
              import('./demo/pages/reminders/log-emails/log-emails.component')
                .then(c => c.LogEmailsComponent)
          }
        ]
      },
      {
        path: 'announcement',
        loadComponent: () =>
          import('./demo/pages/reminders/announcement/announcement.component')
            .then(c => c.AnnouncementComponent)
      }
    ]  
  },
  {
    path: '',
    component: GuestLayoutComponent,
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./demo/pages/authentication/auth-login/auth-login.component').then((c) => c.AuthLoginComponent)
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./demo/pages/authentication/auth-register/auth-register.component').then((c) => c.AuthRegisterComponent)
      }
    ]
  }
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}