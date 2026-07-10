// Angular import
import { Component, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { ThemeService } from 'src/app/services/theme.service';

// project import
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { NavContentComponent } from './nav-content/nav-content.component';

// Icon import
import { IconService } from '@ant-design/icons-angular';
import {
  UserOutline,
  EditOutline,
  SettingOutline,
  LogoutOutline
} from '@ant-design/icons-angular/icons';

@Component({
  selector: 'app-navigation',
  imports: [SharedModule, NavContentComponent, CommonModule, RouterModule],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent {
  private iconService = inject(IconService);
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private router = inject(Router);

  // media 1025 After Use Menu Open
  NavCollapsedMob = output();
  SubmenuCollapse = output();

  navCollapsedMob;
  windowWidth: number;

  // Theme selector state
  showThemeModal = false;
  selectedThemeId = 'sunset';
  availableThemes = [
    { id: 'sunset', name: 'Sunset Indigo', primaryColor: '#30277C', desc: 'Default theme' },
    { id: 'emerald', name: 'Emerald Forest', primaryColor: '#00897B', desc: 'Fresh & clean' },
    { id: 'oceanic', name: 'Oceanic Blue', primaryColor: '#4292C6', desc: 'Calming blue' },
    { id: 'amber', name: 'Golden Amber', primaryColor: '#E5A93C', desc: 'Warm & bright' }
  ];

  get username(): string {
    return localStorage.getItem('username') || 'admin';
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  onProfileClick(action: string): void {
    if (action === 'theme') {
      this.selectedThemeId = this.themeService.getCurrentThemeId();
      this.showThemeModal = true;
    } else {
      console.log(`${action} Profile clicked`);
    }
  }

  closeThemeModal(): void {
    this.showThemeModal = false;
  }

  selectThemeOption(t: any): void {
    this.selectedThemeId = t.id;
  }

  applyThemeOption(): void {
    this.themeService.setTheme(this.selectedThemeId);
    this.showThemeModal = false;
  }

  // Constructor
  constructor() {
    this.windowWidth = window.innerWidth;
    this.navCollapsedMob = false;
    this.selectedThemeId = this.themeService.getCurrentThemeId();

    // Register icons used in the sidebar profile dropdown
    this.iconService.addIcon(
      ...[
        UserOutline,
        EditOutline,
        SettingOutline,
        LogoutOutline
      ]
    );
  }

  // public method
  navCollapseMob() {
    if (this.windowWidth < 1025) {
      this.NavCollapsedMob.emit();
    }
  }

  navSubmenuCollapse() {
    document.querySelector('app-navigation.pc-sidebar')?.classList.add('coded-trigger');
  }
}
