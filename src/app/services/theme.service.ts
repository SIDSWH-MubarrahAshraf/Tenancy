import { Injectable } from '@angular/core';

export interface ThemeConfig {
  id: string;
  sidebarBg: string;
  bg: string;
  cardBg: string;
  headerBg: string;
  primary: string;
  primaryHover: string;
  primarySoft: string;
  primarySoftHover: string;
  border: string;
  shadow: string;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private defaultThemeId = 'sunset';

  private themes: Record<string, ThemeConfig> = {
    sunset: {
      id: 'sunset',
      sidebarBg: '#1B1647',
      bg: '#F5F4FA',
      cardBg: '#FCFBFE',
      headerBg: '#E5E2F8',
      primary: '#30277C',
      primaryHover: '#241D60',
      primarySoft: '#EAE8FC',
      primarySoftHover: '#DFDCFA',
      border: '#C6C3F2',
      shadow: '0 8px 24px rgba(48, 39, 124, 0.06)'
    },
    emerald: {
      id: 'emerald',
      sidebarBg: '#072221',
      bg: '#F4F7F6',
      cardBg: '#FFFFFF',
      headerBg: '#DCEFEF',
      primary: '#0E7A71',
      primaryHover: '#0A5C56',
      primarySoft: '#F0F8F7',
      primarySoftHover: '#DCEFEF',
      border: '#AFD8D4',
      shadow: '0 8px 24px rgba(7, 34, 33, 0.06)'
    },
    oceanic: {
      id: 'oceanic',
      sidebarBg: '#0D2C40',
      bg: '#F2F7FA',
      cardBg: '#FCFDFE',
      headerBg: '#E1F5FE',
      primary: '#4292C6',
      primaryHover: '#2B78A5',
      primarySoft: '#E3F2FD',
      primarySoftHover: '#D0E8FF',
      border: '#B3E5FC',
      shadow: '0 8px 24px rgba(13, 44, 64, 0.06)'
    },
    amber: {
      id: 'amber',
      sidebarBg: '#1C1A17',
      bg: '#FAF6F0',
      cardBg: '#FFFFFF',
      headerBg: '#F8EED8',
      primary: '#E5A93C',
      primaryHover: '#C68A28',
      primarySoft: '#FCF6EA',
      primarySoftHover: '#F5E9D3',
      border: '#E3CE9F',
      shadow: '0 8px 24px rgba(28, 26, 23, 0.06)'
    }
  };

  getCurrentThemeId(): string {
    return localStorage.getItem('theme') || this.defaultThemeId;
  }

  setTheme(themeId: string): void {
    // If setting theme, check if older key was stored as carbon (fallback to amber)
    let id = themeId;
    if (themeId === 'carbon') id = 'amber';
    
    const theme = this.themes[id] || this.themes[this.defaultThemeId];
    localStorage.setItem('theme', theme.id);
    this.applyTheme(theme);
  }

  initTheme(): void {
    const themeId = this.getCurrentThemeId();
    this.setTheme(themeId);
  }

  resetTheme(): void {
    localStorage.removeItem('theme');
    this.applyTheme(this.themes[this.defaultThemeId]);
  }

  private applyTheme(theme: ThemeConfig): void {
    const root = document.documentElement;
    root.style.setProperty('--erp-sidebar-bg', theme.sidebarBg);
    root.style.setProperty('--erp-bg', theme.bg);
    root.style.setProperty('--erp-card-bg', theme.cardBg);
    root.style.setProperty('--erp-header-bg', theme.headerBg);
    root.style.setProperty('--erp-primary', theme.primary);
    root.style.setProperty('--erp-primary-hover', theme.primaryHover);
    root.style.setProperty('--erp-primary-soft', theme.primarySoft);
    root.style.setProperty('--erp-primary-soft-hover', theme.primarySoftHover);
    root.style.setProperty('--erp-border', theme.border);
    root.style.setProperty('--erp-shadow', theme.shadow);
    root.style.setProperty('--erp-shadow-sm', theme.shadow.replace('0.06', '0.04'));
  }
}
