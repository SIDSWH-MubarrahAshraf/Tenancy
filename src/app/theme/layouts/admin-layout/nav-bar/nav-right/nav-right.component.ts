// angular import
import { Component, output, inject, input, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { DashboardService } from 'src/app/services/dashboard.service';
import { CommonModule } from '@angular/common';

// project import
import { SharedModule } from 'src/app/theme/shared/shared.module';

// third party

// icon
import { IconService } from '@ant-design/icons-angular';
import {
  BellOutline,
  SettingOutline,
  GiftOutline,
  MessageOutline,
  PhoneOutline,
  CheckCircleOutline,
  LogoutOutline,
  EditOutline,
  UserOutline,
  ProfileOutline,
  WalletOutline,
  QuestionCircleOutline,
  LockOutline,
  CommentOutline,
  UnorderedListOutline,
  ArrowRightOutline,
  GithubOutline
} from '@ant-design/icons-angular/icons';

@Component({
  selector: 'app-nav-right',
  imports: [SharedModule, RouterModule, CommonModule],
  templateUrl: './nav-right.component.html',
  styleUrls: ['./nav-right.component.scss']
})
export class NavRightComponent implements OnInit {
  private iconService = inject(IconService);
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  notifications: any[] = [];
  unreadCount = 0;

  get username(): string {
    return localStorage.getItem('username') || 'admin';
  }

  ngOnInit(): void {
    this.loadAlerts();
  }

  loadAlerts(): void {
    this.dashboardService.getAlerts().subscribe({
      next: (res) => {
        let alertsData = res?.data;
        if (typeof alertsData === 'string') {
          try {
            alertsData = JSON.parse(alertsData);
          } catch (e) {
            console.error('Failed to parse alerts data', e);
          }
        }
        if (alertsData) {
          const chequesDue = alertsData.chequesDue || [];
          const bouncedCheques = alertsData.bouncedCheques || [];
          
          this.notifications = [];

          // Map bounced cheques
          bouncedCheques.forEach((item: any) => {
            this.notifications.push({
              id: item.id,
              type: 'bounced',
              title: `Bounced: ${item.chequeNo}`,
              message: `${item.bankName} · AED ${item.chequeAmount}`,
              reason: item.bounceReason || 'Clearance failure',
              time: 'Action Needed',
              colorClass: 'bg-light-danger text-danger'
            });
          });

          // Map due cheques
          chequesDue.forEach((item: any) => {
            this.notifications.push({
              id: item.id,
              type: 'due',
              title: `Due: ${item.chequeNo}`,
              message: `${item.bankName} · AED ${item.chequeAmount}`,
              reason: `Due: ${new Date(item.chequeDate).toLocaleDateString()}`,
              time: 'Pending',
              colorClass: 'bg-light-warning text-warning'
            });
          });

          this.unreadCount = this.notifications.length;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to fetch navbar alerts', err);
      }
    });
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // public props
  styleSelectorToggle = input<boolean>();
  readonly Customize = output();
  windowWidth: number;
  screenFull: boolean = true;
  direction: string = 'ltr';

  // constructor
  constructor() {
    this.windowWidth = window.innerWidth;
    this.iconService.addIcon(
      ...[
        CheckCircleOutline,
        GiftOutline,
        MessageOutline,
        SettingOutline,
        PhoneOutline,
        LogoutOutline,
        EditOutline,
        UserOutline,
        EditOutline,
        ProfileOutline,
        QuestionCircleOutline,
        LockOutline,
        CommentOutline,
        UnorderedListOutline,
        ArrowRightOutline,
        BellOutline,
        GithubOutline,
        WalletOutline
      ]
    );
  }

  profile = [
    {
      icon: 'edit',
      title: 'Edit Profile'
    },
    {
      icon: 'user',
      title: 'View Profile'
    },
    {
      icon: 'profile',
      title: 'Social Profile'
    },
    {
      icon: 'wallet',
      title: 'Billing'
    },
    {
      icon: 'logout',
      title: 'Logout'
    }
  ];

  setting = [
    {
      icon: 'question-circle',
      title: 'Support'
    },
    {
      icon: 'user',
      title: 'Account Settings'
    },
    {
      icon: 'lock',
      title: 'Privacy Center'
    },
    {
      icon: 'comment',
      title: 'Feedback'
    },
    {
      icon: 'unordered-list',
      title: 'History'
    }
  ];
}
