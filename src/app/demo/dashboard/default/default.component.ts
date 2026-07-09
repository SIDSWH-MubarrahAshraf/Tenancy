import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DashboardService } from 'src/app/services/dashboard.service';

@Component({
  selector: 'app-default',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './default.component.html',
  styleUrls: ['./default.component.scss']
})
export class DefaultComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private cdr = inject(ChangeDetectorRef);

  activeContracts = 0;
  vacantUnits = 0;
  chequesDueIn7Days = 0;
  pendingFinalSettlements = 0;
  chequesDue: any[] = [];
  bouncedCheques: any[] = [];
  expiringContracts: any[] = [];
  isLoading = true;

  userName = 'Admin';
  searchChequeText = '';
  filteredCheques: any[] = [];

  ngOnInit(): void {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        this.userName = u.userName || u.username || 'Admin';
      } catch (e) {
        this.userName = savedUser;
      }
    }
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    
    // Fetch summary
    this.dashboardService.getSummary().subscribe({
      next: (res) => {
        let summaryData = res?.data;
        if (typeof summaryData === 'string') {
          try {
            summaryData = JSON.parse(summaryData);
          } catch (e) {
            console.error('Failed to parse summary data', e);
          }
        }
        if (summaryData) {
          this.activeContracts = summaryData.activeContracts ?? 0;
          this.vacantUnits = summaryData.vacantUnits ?? 0;
          this.chequesDueIn7Days = summaryData.chequesDueIn7Days ?? 0;
          this.pendingFinalSettlements = summaryData.pendingFinalSettlements ?? 0;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Summary fetch error', err);
        this.cdr.detectChanges();
      }
    });

    // Fetch alerts
    this.dashboardService.getAlerts().subscribe({
      next: (res) => {
        this.isLoading = false;
        let alertsData = res?.data;
        if (typeof alertsData === 'string') {
          try {
            alertsData = JSON.parse(alertsData);
          } catch (e) {
            console.error('Failed to parse alerts data', e);
          }
        }
        if (alertsData) {
          this.chequesDue = alertsData.chequesDue || [];
          this.filteredCheques = [...this.chequesDue];
          this.bouncedCheques = alertsData.bouncedCheques || [];
          this.expiringContracts = alertsData.expiringContracts || [];
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Alerts fetch error', err);
        this.cdr.detectChanges();
      }
    });
  }

  filterCheques(): void {
    const q = (this.searchChequeText || '').trim().toLowerCase();
    if (!q) {
      this.filteredCheques = [...this.chequesDue];
    } else {
      this.filteredCheques = this.chequesDue.filter(item => 
        String(item.chequeNo || '').toLowerCase().includes(q) ||
        String(item.bankName || '').toLowerCase().includes(q) ||
        String(item.chequeStatus || '').toLowerCase().includes(q)
      );
    }
    this.cdr.detectChanges();
  }
}
