import { Component, inject, OnInit, ChangeDetectorRef, NgZone, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-month-expiry',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './month-expiry.component.html',
  styleUrls: ['./month-expiry.component.scss']
})
export class MonthExpiryComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  // Base API URL
  private readonly baseUrl = environment.apiUrl.replace(/\/api$/, '');

  // Tab State
  activeTab: 'details' | 'history' | 'moveout' = 'details';

  // Tenant Move Out State
  activeMoveoutTab: 'details' | 'history' = 'details';
  moveoutDetailsList: any[] = [];
  moveoutHistoryList: any[] = [];
  isLoadingMoveoutDetails = false;
  isLoadingMoveoutHistory = false;

  // Master Confirmation List in memory to sync changes immediately across tabs
  masterHistoryList: any[] = [];

  // Modals for Move Out
  showMoveoutPropertyModal = false;
  showMoveoutCustomerModal = false;
  showMoveoutUnitModal = false;

  isLoadingMoveoutProperties = false;
  isLoadingMoveoutCustomers = false;
  isLoadingMoveoutUnits = false;

  moveoutProperties: any[] = [];
  filteredMoveoutProperties: any[] = [];
  searchMoveoutPropertyQuery = '';

  moveoutCustomers: any[] = [];
  filteredMoveoutCustomers: any[] = [];
  searchMoveoutCustomerQuery = '';

  moveoutUnits: any[] = [];
  filteredMoveoutUnits: any[] = [];
  searchMoveoutUnitQuery = '';

  // Filter Bar values
  filterPropertyId = '';
  filterCustomerId = '';
  filterUnitId = '';
  selectedPropertyName = '';

  // Table Lists
  detailsList: any[] = [];
  historyList: any[] = [];

  // Modals & States
  showPropertyModal = false;
  showCustomerModal = false;
  showUnitModal = false;

  isLoadingProperties = false;

  // Data for Modals
  properties: any[] = [];
  filteredProperties: any[] = [];
  searchPropertyQuery = '';

  customers: any[] = [
    { custid: 'CUST-001', custname: 'John Doe' },
    { custid: 'CUST-002', custname: 'Jane Smith' },
    { custid: 'CUST-003', custname: 'Al Alzebaq' }
  ];
  filteredCustomers: any[] = [];
  searchCustomerQuery = '';

  units: any[] = [
    { unitid: 'U-101', unitType: '1BHK', propid: 'PROP-001' },
    { unitid: 'U-102', unitType: '2BHK', propid: 'PROP-001' },
    { unitid: 'U-201', unitType: 'Studio', propid: 'PROP-002' },
    { unitid: 'U-202', unitType: 'Office', propid: 'PROP-002' },
    { unitid: 'U-301', unitType: 'Penthouse', propid: 'PROP-003' },
    { unitid: 'U-302', unitType: '1BHK', propid: 'PROP-003' }
  ];
  filteredUnits: any[] = [];
  searchUnitQuery = '';

  ngOnInit(): void {
    this.loadSweetAlert();
    this.masterHistoryList = this.generateMockHistoryData();
    this.loadDetails();
    this.loadHistory();
    this.filteredCustomers = [...this.customers];
    this.filteredUnits = [...this.units];

    // Load Tenant Move Out
    this.loadMoveoutDetails();
    this.loadMoveoutHistory();
  }

  // Runtime SweetAlert injection to avoid npm dependencies
  private loadSweetAlert(): Promise<any> {
    if ((window as any).Swal) {
      return Promise.resolve((window as any).Swal);
    }
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11';
      script.onload = () => resolve((window as any).Swal);
      document.body.appendChild(script);
    });
  }

  // Tab switching
  setTab(tab: 'details' | 'history' | 'moveout'): void {
    this.activeTab = tab;
  }

  // Clear filters & reload
  refreshPage(): void {
    this.filterPropertyId = '';
    this.filterCustomerId = '';
    this.filterUnitId = '';
    this.selectedPropertyName = '';
    this.loadDetails();
    this.loadHistory();
    this.loadMoveoutDetails();
    this.loadMoveoutHistory();
  }

  onPropertyFilterChange(): void {
    this.loadDetails();
    this.loadHistory();
    this.loadMoveoutDetails();
    this.loadMoveoutHistory();
  }

  // ==================== DATE HELPERS ====================
  parseYYYYMMDD(dateStr: any): Date | null {
    if (!dateStr || dateStr === 0) return null;
    const s = dateStr.toString().trim();
    if (s.length !== 8) return null;
    const d = new Date(Number(s.substring(0, 4)), Number(s.substring(4, 6)) - 1, Number(s.substring(6, 8)));
    d.setHours(0, 0, 0, 0);
    return d;
  }

  formatDDMMYYYY(dateStr: any): string {
    const d = this.parseYYYYMMDD(dateStr);
    if (!d) return '';
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  }

  formatDateSafe(val: any): string {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d.getTime())) {
      // Try YYYYMMDD parsing
      const parsed = this.parseYYYYMMDD(val);
      if (parsed) return this.formatDDMMYYYY(val);
      return String(val);
    }
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  }

  parseDateSafe(dateText: string): string | null {
    if (!dateText) return null;
    const parts = dateText.split('-');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    return isNaN(date.getTime()) ? null : date.toISOString();
  }

  // ==================== DETAILS TAB logic ====================
  generateMockDetailsData(): any[] {
    const today = new Date();
    
    const toYYYYMMDD = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return Number(`${y}${m}${day}`);
    };

    const addDays = (d: Date, days: number) => {
      const res = new Date(d);
      res.setDate(res.getDate() + days);
      return res;
    };

    return [
      {
        unitid: 'U-101',
        unitType: '1BHK',
        idcust: 'CUST-001',
        namecust: 'John Doe',
        periodfrom: toYYYYMMDD(addDays(today, -330)),
        periodto: toYYYYMMDD(addDays(today, 15)),
        annualrent: 45000,
        proposedAnnual: 48000,
        status: 'Email',
        emailDateTime: '',
        ackDate: '',
        propid: 'PROP-001',
        buildid: 'BUILD-001'
      },
      {
        unitid: 'U-102',
        unitType: '2BHK',
        idcust: 'CUST-002',
        namecust: 'Jane Smith',
        periodfrom: toYYYYMMDD(addDays(today, -320)),
        periodto: toYYYYMMDD(addDays(today, 32)),
        annualrent: 65000,
        proposedAnnual: null,
        status: 'Hold',
        emailDateTime: '',
        ackDate: '',
        propid: 'PROP-001',
        buildid: 'BUILD-001'
      },
      {
        unitid: 'U-201',
        unitType: 'Studio',
        idcust: 'CUST-003',
        namecust: 'Al Alzebaq Tenant',
        periodfrom: toYYYYMMDD(addDays(today, -300)),
        periodto: toYYYYMMDD(addDays(today, 58)),
        annualrent: 32000,
        proposedAnnual: 34000,
        status: 'Email',
        emailDateTime: '',
        ackDate: '',
        propid: 'PROP-002',
        buildid: 'BUILD-002'
      },
      {
        unitid: 'U-301',
        unitType: 'Penthouse',
        idcust: 'CUST-004',
        namecust: 'Robert Brown',
        periodfrom: toYYYYMMDD(addDays(today, -280)),
        periodto: toYYYYMMDD(addDays(today, 78)),
        annualrent: 120000,
        proposedAnnual: null,
        status: 'Hold',
        emailDateTime: '',
        ackDate: '',
        propid: 'PROP-003',
        buildid: 'BUILD-003'
      },
      {
        unitid: 'U-302',
        unitType: '1BHK',
        idcust: 'CUST-005',
        namecust: 'Sarah Connor',
        periodfrom: toYYYYMMDD(addDays(today, -380)),
        periodto: toYYYYMMDD(addDays(today, -5)), // Expired
        annualrent: 42000,
        proposedAnnual: null,
        status: 'Hold',
        emailDateTime: '',
        ackDate: '',
        propid: 'PROP-003',
        buildid: 'BUILD-003'
      },
      {
        unitid: 'U-104',
        unitType: '1BHK',
        idcust: 'CUST-006',
        namecust: 'Bruce Wayne',
        periodfrom: toYYYYMMDD(addDays(today, -200)),
        periodto: toYYYYMMDD(addDays(today, 120)), // Outside 90 days
        annualrent: 90000,
        proposedAnnual: null,
        status: 'Hold',
        emailDateTime: '',
        ackDate: '',
        propid: 'PROP-001',
        buildid: 'BUILD-001'
      }
    ];
  }

  loadDetails(): void {
    const rawData = this.generateMockDetailsData();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const future90 = new Date(today);
    future90.setDate(future90.getDate() + 90);
    future90.setHours(23, 59, 59, 999);

    let filtered = rawData.map(u => ({
      ...u,
      _periodToDate: this.parseYYYYMMDD(u.periodto)
    }))
    .filter(u => u._periodToDate && u._periodToDate >= today && u._periodToDate <= future90)
    .sort((a, b) => (a._periodToDate?.getTime() || 0) - (b._periodToDate?.getTime() || 0));

    if (this.filterPropertyId) {
      filtered = filtered.filter(u => String(u.propid || '').trim().toLowerCase() === this.filterPropertyId.trim().toLowerCase());
    }
    if (this.filterCustomerId) {
      filtered = filtered.filter(u => String(u.idcust || '').trim().toLowerCase() === this.filterCustomerId.trim().toLowerCase());
    }
    if (this.filterUnitId) {
      filtered = filtered.filter(u => String(u.unitid || '').trim().toLowerCase() === this.filterUnitId.trim().toLowerCase());
    }

    this.detailsList = filtered;
  }

  validateProposedAnnual(item: any): void {
    if (item.proposedAnnual !== null && item.proposedAnnual !== undefined && String(item.proposedAnnual).trim() !== '') {
      const numVal = Number(item.proposedAnnual);
      if (isNaN(numVal)) {
        (window as any).Swal.fire({
          icon: 'error',
          title: 'Invalid Input',
          text: 'Proposed Annual only accepts numeric values!'
        });
        item.proposedAnnual = null;
      }
    }
  }

  submitDetails(): void {
    const rowsToSend = this.detailsList.filter(item => item.status === 'Email');

    if (rowsToSend.length === 0) {
      (window as any).Swal.fire({
        icon: 'info',
        title: 'No Rows Selected',
        text: "No rows with status 'Email' found in Details table.",
        timer: 3000
      });
      return;
    }

    (window as any).Swal.fire({
      title: 'Send Emails',
      text: `Are you sure you want to send renewal emails for ${rowsToSend.length} selected leases?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: 'var(--erp-success, #2E7D32)',
      cancelButtonColor: 'var(--erp-danger, #C62828)',
      confirmButtonText: 'Yes, Send!',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    }).then((result: any) => {
      if (result.isConfirmed) {
        (window as any).Swal.fire({
          title: 'Sending Emails...',
          html: 'Please wait while emails are being sent.<br/><br/><div class="spinner-border text-primary" role="status"></div>',
          allowOutsideClick: false,
          showConfirmButton: false
        });

        // Simulate API Payload construction to keep code clean and aligned with backend
        const rowsPayload = rowsToSend.map(item => ({
          COPERATION: 2,
          UID: item.unitid,
          UnitType: item.unitType,
          CustCode: item.idcust,
          CustName: item.namecust,
          FPeriod: this.parseDateSafe(this.formatDDMMYYYY(item.periodfrom)),
          TPeriod: this.parseDateSafe(this.formatDDMMYYYY(item.periodto)),
          CAnnual: Number(item.annualrent) || 0,
          PAnnual: Number(item.proposedAnnual) || 0,
          AuditUser: localStorage.getItem('username') || 'System',
          Action: item.status,
          ADate: new Date().toISOString(),
          EDate: new Date().toISOString(),
          AuditDate: new Date().toISOString(),
          EmailStatus: 1
        }));

        console.log('Sending emails payload:', rowsPayload);

        // Log sent emails locally
        this.logSentEmails(rowsToSend, 'Renewal');

        setTimeout(() => {
          (window as any).Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: `${rowsToSend.length} renewal email(s) successfully processed! (Simulated)`,
            confirmButtonText: 'OK'
          }).then(() => {
            this.refreshPage();
          });
        }, 1500);
      }
    });
  }

  // ==================== HISTORY TAB logic ====================
  generateMockHistoryData(): any[] {
    const today = new Date();
    
    const toYYYYMMDD = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return Number(`${y}${m}${day}`);
    };

    const addDays = (d: Date, days: number) => {
      const res = new Date(d);
      res.setDate(res.getDate() + days);
      return res;
    };

    return [
      {
        eDate: toYYYYMMDD(addDays(today, -2)),
        lineNum: 1,
        uid: 'U-101',
        unitType: '1BHK',
        custCode: 'CUST-001',
        custName: 'John Doe',
        fPeriod: toYYYYMMDD(addDays(today, -330)),
        tPeriod: toYYYYMMDD(addDays(today, 15)),
        cAnnual: 45000,
        pAnnual: 48000,
        action: 'Awaiting Confirmation',
        aDate: ''
      },
      {
        eDate: toYYYYMMDD(addDays(today, -5)),
        lineNum: 2,
        uid: 'U-201',
        unitType: 'Studio',
        custCode: 'CUST-003',
        custName: 'Al Alzebaq Tenant',
        fPeriod: toYYYYMMDD(addDays(today, -300)),
        tPeriod: toYYYYMMDD(addDays(today, 58)),
        cAnnual: 32000,
        pAnnual: 34000,
        action: 'Confirmed',
        aDate: toYYYYMMDD(addDays(today, -4))
      },
      {
        eDate: toYYYYMMDD(addDays(today, -10)),
        lineNum: 3,
        uid: 'U-301',
        unitType: 'Penthouse',
        custCode: 'CUST-004',
        custName: 'Robert Brown',
        fPeriod: toYYYYMMDD(addDays(today, -280)),
        tPeriod: toYYYYMMDD(addDays(today, 78)),
        cAnnual: 120000,
        pAnnual: 125000,
        action: 'Not Interested',
        aDate: toYYYYMMDD(addDays(today, -9))
      }
    ];
  }

  loadHistory(): void {
    // Read from the shared master history list in memory
    let filtered = [...this.masterHistoryList];

    // Filter out the "Not Interested" records from Client Confirmation tab
    filtered = filtered.filter(u => u.action !== 'Not Interested');

    if (this.filterPropertyId) {
      filtered = filtered.filter(u => {
        let pid = 'PROP-001';
        if (u.uid === 'U-201') pid = 'PROP-002';
        if (u.uid === 'U-301') pid = 'PROP-003';
        return pid.trim().toLowerCase() === this.filterPropertyId.trim().toLowerCase();
      });
    }
    if (this.filterCustomerId) {
      filtered = filtered.filter(u => String(u.custCode || '').trim().toLowerCase() === this.filterCustomerId.trim().toLowerCase());
    }
    if (this.filterUnitId) {
      filtered = filtered.filter(u => String(u.uid || '').trim().toLowerCase() === this.filterUnitId.trim().toLowerCase());
    }

    this.historyList = filtered;
  }

  submitHistory(): void {
    if (this.historyList.length === 0) {
      (window as any).Swal.fire({
        icon: 'info',
        title: 'No Data',
        text: "No rows found in History table.",
        timer: 3000
      });
      return;
    }

    (window as any).Swal.fire({
      title: 'Update Existing Records',
      text: "Are you sure you want to update all rows from History table?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: 'var(--erp-success, #2E7D32)',
      cancelButtonColor: 'var(--erp-danger, #C62828)',
      confirmButtonText: 'Yes, Update!',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    }).then((result: any) => {
      if (result.isConfirmed) {
        (window as any).Swal.fire({
          title: 'Updating Records...',
          html: 'Please wait while we update the data.<br/><br/><div class="spinner-border text-primary" role="status"></div>',
          allowOutsideClick: false,
          showConfirmButton: false
        });

        // Simulate API Payload construction for updating
        const updatePayload = this.masterHistoryList.map(item => ({
          COPERATION: 3,
          EmailDateTime: this.parseDateSafe(this.formatDateSafe(item.eDate)),
          LineNum: Number(item.lineNum) || null,
          UID: item.uid,
          UnitType: item.unitType,
          CustCode: item.custCode,
          CustName: item.custName,
          FPeriod: this.parseDateSafe(this.formatDateSafe(item.fPeriod)),
          TPeriod: this.parseDateSafe(this.formatDateSafe(item.tPeriod)),
          CAnnual: Number(item.cAnnual) || null,
          PAnnual: Number(item.pAnnual) || null,
          Action: item.action,
          ADate: new Date().toISOString(),
          EDate: this.parseDateSafe(this.formatDateSafe(item.eDate)),
          IsActive: 1,
          AuditDate: new Date().toISOString(),
          AuditUser: localStorage.getItem('username') || 'System',
          EmailStatus: 1
        }));

        console.log('Update history payload:', updatePayload);

        setTimeout(() => {
          (window as any).Swal.fire({
            icon: 'success',
            title: 'Updated Successfully!',
            text: `${this.masterHistoryList.length} record(s) successfully updated! (Simulated)`,
            showConfirmButton: true,
            confirmButtonText: 'OK'
          }).then(() => {
            this.refreshPage();
          });
        }, 1200);
      }
    });
  }

  onHistoryStatusChange(item: any): void {
    const match = this.masterHistoryList.find(h => h.uid === item.uid && h.custCode === item.custCode);
    if (match) {
      match.action = item.action;
    }

    // Re-evaluate list items across all tabs immediately
    this.loadHistory();
    this.loadMoveoutDetails();

    if (item.action === 'Not Interested') {
      (window as any).Swal.fire({
        icon: 'success',
        title: 'Status Updated',
        text: `Tenant "${item.custName}" has been moved to the Tenant Move Out tab.`,
        timer: 3000,
        showConfirmButton: false
      });
    }
  }

  toggleStatus(item: any, event: any): void {
    item.status = event.target.checked ? 'Email' : 'Hold';
    this.cdr.detectChanges();
  }

  getHTMLDate(item: any): string {
    if (!item.aDate) return '';
    const s = item.aDate.toString();
    if (s.length === 8) {
      return `${s.substring(0, 4)}-${s.substring(4, 6)}-${s.substring(6, 8)}`;
    }
    if (s.includes('-')) return s;
    return '';
  }

  setHTMLDate(item: any, value: string): void {
    if (!value) {
      item.aDate = '';
    } else {
      item.aDate = value.replace(/-/g, '');
    }
    this.onHistoryStatusChange(item);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown-container')) {
      this.historyList.forEach(item => item.showDropdown = false);
    }
  }

  toggleDropdown(item: any, event: MouseEvent): void {
    event.stopPropagation();
    const current = item.showDropdown;
    this.historyList.forEach(h => h.showDropdown = false);
    item.showDropdown = !current;

    if (item.showDropdown) {
      const trigger = event.currentTarget as HTMLElement;
      const rect = trigger.getBoundingClientRect();
      item.dropdownStyle = {
        position: 'fixed',
        top: `${rect.bottom + 6}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        zIndex: '9999'
      };
      this.cdr.detectChanges();
    }
  }

  selectDropdownAction(item: any, action: string, event: MouseEvent): void {
    event.stopPropagation();
    item.action = action;
    item.showDropdown = false;
    this.onHistoryStatusChange(item);
  }

  // ==================== LOOKUP MODALS ====================

  // 1️⃣ Property Master lookup
  openPropertyModal(): void {
    this.showPropertyModal = true;
    this.isLoadingProperties = true;
    this.properties = [];
    this.filteredProperties = [];

    const url = `${this.baseUrl}/PropertyManagement/GetPropertyMasters`;
    this.http.post<any[]>(url, { COPERATION: 1 }).subscribe({
      next: (data) => {
        this.properties = data || [];
        this.filterProperties();
        this.isLoadingProperties = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load property masters from API', err);
        // Load fallback properties in case the endpoint fails
        this.properties = [
          { propid: 'PROP-001', buildname: 'Al Alzebaq Tower A', landcode: 'LND-100', landname: 'Landlord A', id: 1 },
          { propid: 'PROP-002', buildname: 'Al Alzebaq Tower B', landcode: 'LND-200', landname: 'Landlord B', id: 2 },
          { propid: 'PROP-003', buildname: 'Al Alzebaq Villa 5', landcode: 'LND-300', landname: 'Landlord C', id: 3 }
        ];
        this.filterProperties();
        this.isLoadingProperties = false;
        this.cdr.detectChanges();
      }
    });
  }

  filterProperties(): void {
    const q = (this.searchPropertyQuery || '').trim().toLowerCase();
    if (!q) {
      this.filteredProperties = [...this.properties];
    } else {
      this.filteredProperties = this.properties.filter(p =>
        String(p.propid || '').toLowerCase().includes(q) ||
        String(p.buildname || '').toLowerCase().includes(q) ||
        String(p.propertyName || '').toLowerCase().includes(q)
      );
    }
  }

  selectProperty(propid: string, idKey?: any): void {
    const key = idKey || propid;
    this.filterPropertyId = propid;
    this.showPropertyModal = false;

    // Call the Get Property by ID API
    const url = `${environment.apiUrl}/ty/properties/${key}`;
    this.http.get<any>(url).subscribe({
      next: (res) => {
        console.log('Get Property By ID response:', res);
        const propData = res?.data || res;
        this.selectedPropertyName = propData?.propertyName || propData?.buildname || '';
        this.loadDetails();
        this.loadHistory();
        this.loadMoveoutDetails();
        this.loadMoveoutHistory();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to get property by ID', err);
        // Set dynamic fallback name based on mock list
        const match = this.properties.find(p => p.propid === propid);
        this.selectedPropertyName = match ? (match.buildname || match.propertyName) : '';
        this.loadDetails();
        this.loadHistory();
        this.loadMoveoutDetails();
        this.loadMoveoutHistory();
        this.cdr.detectChanges();
      }
    });
  }

  // 2️⃣ Customer lookup (dummy list)
  openCustomerModal(): void {
    this.showCustomerModal = true;
    this.filterCustomers();
  }

  filterCustomers(): void {
    const q = (this.searchCustomerQuery || '').trim().toLowerCase();
    if (!q) {
      this.filteredCustomers = [...this.customers];
    } else {
      this.filteredCustomers = this.customers.filter(c =>
        String(c.custid || '').toLowerCase().includes(q) ||
        String(c.custname || '').toLowerCase().includes(q)
      );
    }
  }

  selectCustomer(custid: string): void {
    this.filterCustomerId = custid;
    this.showCustomerModal = false;
    this.loadDetails();
    this.loadHistory();
    this.loadMoveoutDetails();
    this.loadMoveoutHistory();
  }

  // 3️⃣ Unit lookup (dummy list)
  openUnitModal(): void {
    this.showUnitModal = true;
    this.filterUnits();
  }

  filterUnits(): void {
    const q = (this.searchUnitQuery || '').trim().toLowerCase();
    if (!q) {
      this.filteredUnits = [...this.units];
    } else {
      this.filteredUnits = this.units.filter(u =>
        String(u.unitid || '').toLowerCase().includes(q) ||
        String(u.unitType || '').toLowerCase().includes(q) ||
        String(u.propid || '').toLowerCase().includes(q)
      );
    }
  }

  selectUnit(unitid: string): void {
    this.filterUnitId = unitid;
    this.showUnitModal = false;
    this.loadDetails();
    this.loadHistory();
    this.loadMoveoutDetails();
    this.loadMoveoutHistory();
  }

  // =========================================================================
  // TENANT MOVE OUT LOGIC
  // =========================================================================

  setMoveoutTab(tab: 'details' | 'history'): void {
    this.activeMoveoutTab = tab;
  }

  refreshMoveoutPage(): void {
    this.filterPropertyId = '';
    this.filterCustomerId = '';
    this.filterUnitId = '';
    this.loadMoveoutDetails();
    this.loadMoveoutHistory();
  }

  loadMoveoutDetails(): void {
    this.isLoadingMoveoutDetails = true;
    this.cdr.detectChanges();

    const url = `${this.baseUrl}/Reminders/GetMoveOutwithoutHistory`;
    this.http.post<any[]>(url, { COPERATION: 1 }).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          this.isLoadingMoveoutDetails = false;
          let rawList = response || [];
          if (response && (response as any).data) {
            rawList = (response as any).data;
          }

          // 1. Filter by 90-day expiry date window
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const future90 = new Date(today);
          future90.setDate(future90.getDate() + 90);

          let filtered = rawList.filter((item: any) => {
            const periodToDate = this.parseDateString(item.periodto);
            if (!periodToDate) return false;
            return periodToDate >= today && periodToDate <= future90;
          });

          // 2. Map "Not Interested" records from masterHistoryList
          const moveoutFromHistory = this.masterHistoryList
            .filter(h => h.action === 'Not Interested')
            .map(h => ({
              unitid: h.uid,
              unittype: h.unitType || 'Apartment',
              idcust: h.custCode,
              namecust: h.custName,
              periodfrom: h.fPeriod,
              periodto: h.tPeriod,
              annualrent: h.cAnnual,
              status: 'Hold',
              propid: h.uid.startsWith('U-1') ? 'PROP-001' : (h.uid.startsWith('U-2') ? 'PROP-002' : 'PROP-003')
            }));

          // Merge them, avoiding duplicates by unitid
          const mergedList = [...moveoutFromHistory];
          filtered.forEach((item: any) => {
            if (!mergedList.some(m => m.unitid === item.unitid)) {
              mergedList.push({
                unitid: item.unitid,
                unittype: item.unittype,
                idcust: item.idcust,
                namecust: item.namecust,
                periodfrom: item.periodfrom,
                periodto: item.periodto,
                annualrent: item.annualrent,
                status: item.status || 'Hold',
                propid: item.propid
              });
            }
          });

          // 3. Local searches / filters
          let finalFiltered = mergedList;
          if (this.filterPropertyId) {
            finalFiltered = finalFiltered.filter((item: any) =>
              String(item.propid || '').trim().toLowerCase() === this.filterPropertyId.trim().toLowerCase()
            );
          }
          if (this.filterCustomerId) {
            finalFiltered = finalFiltered.filter((item: any) =>
              String(item.idcust || '').trim().toLowerCase() === this.filterCustomerId.trim().toLowerCase()
            );
          }
          if (this.filterUnitId) {
            finalFiltered = finalFiltered.filter((item: any) =>
              String(item.unitid || '').trim().toLowerCase() === this.filterUnitId.trim().toLowerCase()
            );
          }

          this.moveoutDetailsList = finalFiltered.map((item: any) => ({
            ...item,
            proposedAnnual: item.proposedAnnual || item.annualrent,
            status: item.status || 'Hold'
          }));

          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          console.error('Failed to load moveout details from API', err);
          this.isLoadingMoveoutDetails = false;
          
          // Map "Not Interested" records from masterHistoryList even on error!
          const moveoutFromHistory = this.masterHistoryList
            .filter(h => h.action === 'Not Interested')
            .map(h => ({
              unitid: h.uid,
              unittype: h.unitType || 'Apartment',
              idcust: h.custCode,
              namecust: h.custName,
              periodfrom: h.fPeriod,
              periodto: h.tPeriod,
              annualrent: h.cAnnual,
              status: 'Hold',
              propid: h.uid.startsWith('U-1') ? 'PROP-001' : (h.uid.startsWith('U-2') ? 'PROP-002' : 'PROP-003')
            }));

          let finalFiltered = moveoutFromHistory;
          if (this.filterPropertyId) {
            finalFiltered = finalFiltered.filter(u => u.propid.trim().toLowerCase() === this.filterPropertyId.trim().toLowerCase());
          }
          if (this.filterCustomerId) {
            finalFiltered = finalFiltered.filter(u => u.idcust.trim().toLowerCase() === this.filterCustomerId.trim().toLowerCase());
          }
          if (this.filterUnitId) {
            finalFiltered = finalFiltered.filter(u => u.unitid.trim().toLowerCase() === this.filterUnitId.trim().toLowerCase());
          }

          this.moveoutDetailsList = finalFiltered;
          this.cdr.detectChanges();
        });
      }
    });
  }

  loadMoveoutHistory(): void {
    this.isLoadingMoveoutHistory = true;
    this.cdr.detectChanges();

    const url = `${this.baseUrl}/PropertyManagement/GetTenantMoveoutList`;
    this.http.post<any[]>(url, { COPERATION: 1 }).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          this.isLoadingMoveoutHistory = false;
          let rawList = response || [];
          if (response && (response as any).data) {
            rawList = (response as any).data;
          }

          this.moveoutHistoryList = rawList;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          console.error('Failed to load moveout history from API', err);
          this.isLoadingMoveoutHistory = false;
          
          // Fallback mock data
          this.moveoutHistoryList = [
            {
              eDate: '20260705',
              uid: 'U-301',
              custCode: 'CUST-004',
              custName: 'Robert Brown',
              fPeriod: '20251001',
              tPeriod: '20260930',
              cAnnual: 120000
            }
          ];
          this.cdr.detectChanges();
        });
      }
    });
  }

  submitMoveoutDetails(): void {
    const rowsToSend = this.moveoutDetailsList.filter(item => item.status === 'Email');

    if (rowsToSend.length === 0) {
      (window as any).Swal.fire({
        icon: 'info',
        title: 'No Rows Selected',
        text: "No rows with status 'Email' found in Details table.",
        timer: 3000
      });
      return;
    }

    (window as any).Swal.fire({
      title: 'Send Email',
      text: "Are you sure you want to Send Emails?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: 'var(--erp-primary, #30277C)',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, Send!',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    }).then((result: any) => {
      if (result.isConfirmed) {
        (window as any).Swal.fire({
          title: 'Sending Emails...',
          html: 'Please wait while emails are being sent.<br/><br/><div class="spinner-border text-primary" role="status"></div>',
          allowOutsideClick: false,
          showConfirmButton: false
        });

        // Format payload
        const payload = rowsToSend.map(item => ({
          COPERATION: 2,
          UID: item.unitid,
          UnitType: item.unittype,
          CustCode: item.idcust,
          CustName: item.namecust,
          FPeriod: this.parseDateSafe(this.formatDateSafe(item.periodfrom)),
          TPeriod: this.parseDateSafe(this.formatDateSafe(item.periodto)),
          CAnnual: Number(item.annualrent) || 0,
          AuditUser: localStorage.getItem('username') || 'System',
          Action: item.status,
          ADate: new Date().toISOString(),
          EDate: new Date().toISOString(),
          AuditDate: new Date().toISOString(),
          EmailStatus: 1
        }));

        console.log("Tenant Move Out Send Payload:", payload);

        // Log sent emails locally
        this.logSentEmails(rowsToSend, 'Move-Out');

        const url = `${this.baseUrl}/PropertyManagement/AUDTenantMoveOutData`;
        this.http.post<any>(url, payload).subscribe({
          next: (res) => {
            this.ngZone.run(() => {
              (window as any).Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: `${payload.length} email(s) sent successfully!`,
                confirmButtonText: 'OK'
              }).then(() => {
                this.refreshMoveoutPage();
              });
            });
          },
          error: (err) => {
            this.ngZone.run(() => {
              console.error('Failed to submit moveout details:', err);
              (window as any).Swal.fire({
                icon: 'success',
                title: 'Simulated Success!',
                text: `${payload.length} email(s) simulated successfully!`,
                confirmButtonText: 'OK'
              }).then(() => {
                this.refreshMoveoutPage();
              });
            });
          }
        });
      }
    });
  }

  // ==================== LOOKUPS FOR TENANT MOVE OUT ====================

  openMoveoutPropertyModal(): void {
    this.showMoveoutPropertyModal = true;
    this.isLoadingMoveoutProperties = true;
    this.moveoutProperties = [];
    this.filteredMoveoutProperties = [];

    const url = `${this.baseUrl}/PropertyManagement/GetPropertyMasters`;
    this.http.post<any[]>(url, { COPERATION: 1 }).subscribe({
      next: (data) => {
        this.ngZone.run(() => {
          this.moveoutProperties = data || [];
          this.filterMoveoutProperties();
          this.isLoadingMoveoutProperties = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          console.error('Failed to load moveout properties', err);
          this.moveoutProperties = [
            { propid: 'PROP-001', buildname: 'Al Alzebaq Tower A', landcode: 'LND-100', landname: 'Landlord A' },
            { propid: 'PROP-002', buildname: 'Al Alzebaq Tower B', landcode: 'LND-200', landname: 'Landlord B' },
            { propid: 'PROP-003', buildname: 'Al Alzebaq Villa 5', landcode: 'LND-300', landname: 'Landlord C' }
          ];
          this.filterMoveoutProperties();
          this.isLoadingMoveoutProperties = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  filterMoveoutProperties(): void {
    const q = (this.searchMoveoutPropertyQuery || '').trim().toLowerCase();
    if (!q) {
      this.filteredMoveoutProperties = [...this.moveoutProperties];
    } else {
      this.filteredMoveoutProperties = this.moveoutProperties.filter(p =>
        String(p.propid || '').toLowerCase().includes(q) ||
        String(p.buildname || '').toLowerCase().includes(q) ||
        String(p.landname || '').toLowerCase().includes(q)
      );
    }
    this.cdr.detectChanges();
  }

  selectMoveoutProperty(prop: any): void {
    this.filterPropertyId = prop.propid || '';
    this.showMoveoutPropertyModal = false;
    this.loadMoveoutDetails();
    this.loadMoveoutHistory();
  }

  openMoveoutCustomerModal(): void {
    this.showMoveoutCustomerModal = true;
    this.isLoadingMoveoutCustomers = true;
    this.moveoutCustomers = [];
    this.filteredMoveoutCustomers = [];

    const url = `${this.baseUrl}/Reminder/GetMonthExpiry`;
    this.http.post<any[]>(url, { COPERATION: 1 }).subscribe({
      next: (data) => {
        this.ngZone.run(() => {
          this.moveoutCustomers = data || [];
          this.filterMoveoutCustomers();
          this.isLoadingMoveoutCustomers = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          console.error('Failed to load moveout customers', err);
          this.moveoutCustomers = [
            { idcust: 'CUST-001', namecust: 'John Doe' },
            { idcust: 'CUST-002', namecust: 'Jane Smith' },
            { idcust: 'CUST-004', namecust: 'Robert Brown' }
          ];
          this.filterMoveoutCustomers();
          this.isLoadingMoveoutCustomers = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  filterMoveoutCustomers(): void {
    const q = (this.searchMoveoutCustomerQuery || '').trim().toLowerCase();
    if (!q) {
      this.filteredMoveoutCustomers = [...this.moveoutCustomers];
    } else {
      this.filteredMoveoutCustomers = this.moveoutCustomers.filter(c =>
        String(c.idcust || '').toLowerCase().includes(q) ||
        String(c.namecust || '').toLowerCase().includes(q)
      );
    }
    this.cdr.detectChanges();
  }

  selectMoveoutCustomer(cust: any): void {
    this.filterCustomerId = cust.idcust || '';
    this.showMoveoutCustomerModal = false;
    this.loadMoveoutDetails();
    this.loadMoveoutHistory();
  }

  openMoveoutUnitModal(): void {
    this.showMoveoutUnitModal = true;
    this.isLoadingMoveoutUnits = true;
    this.moveoutUnits = [];
    this.filteredMoveoutUnits = [];

    const url = `${this.baseUrl}/Reminders/GetMoveOutwithoutHistory`;
    this.http.post<any[]>(url, { COPERATION: 1 }).subscribe({
      next: (data) => {
        this.ngZone.run(() => {
          this.moveoutUnits = data || [];
          this.filterMoveoutUnits();
          this.isLoadingMoveoutUnits = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          console.error('Failed to load moveout units', err);
          this.moveoutUnits = [
            { unitid: 'U-101', unittype: '1BHK' },
            { unitid: 'U-202', unittype: 'Office' },
            { unitid: 'U-301', unittype: 'Penthouse' }
          ];
          this.filterMoveoutUnits();
          this.isLoadingMoveoutUnits = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  filterMoveoutUnits(): void {
    const q = (this.searchMoveoutUnitQuery || '').trim().toLowerCase();
    if (!q) {
      this.filteredMoveoutUnits = [...this.moveoutUnits];
    } else {
      this.filteredMoveoutUnits = this.moveoutUnits.filter(u =>
        String(u.unitid || '').toLowerCase().includes(q) ||
        String(u.unittype || '').toLowerCase().includes(q)
      );
    }
    this.cdr.detectChanges();
  }

  selectMoveoutUnit(unit: any): void {
    this.filterUnitId = unit.unitid || '';
    this.showMoveoutUnitModal = false;
    this.loadMoveoutDetails();
    this.loadMoveoutHistory();
  }

  private parseDateString(dateStr: any): Date | null {
    if (!dateStr) return null;
    const str = dateStr.toString();
    if (str.length !== 8) return null;
    return new Date(Number(str.substring(0, 4)), Number(str.substring(4, 6)) - 1, Number(str.substring(6, 8)));
  }

  logSentEmails(rows: any[], type: 'Renewal' | 'Move-Out' | 'Announcement', attachments: any[] = []): void {
    const raw = localStorage.getItem('email_logs');
    const logs = raw ? JSON.parse(raw) : [];

    rows.forEach(item => {
      const logId = `MSG-${Math.floor(100 + Math.random() * 900)}`;
      
      let unit = item.unitid || item.uid || '';
      let pDate = item.periodto || item.tPeriod || '';
      if (pDate instanceof Date) {
        pDate = this.formatDDMMYYYY(pDate);
      } else if (typeof pDate === 'number') {
        const parsed = this.parseDateString(pDate);
        pDate = parsed ? this.formatDDMMYYYY(parsed) : String(pDate);
      }

      logs.push({
        id: logId,
        sender: 'noreply@alzebaq.com',
        recipient: item.idcust ? `${item.idcust.toLowerCase()}@gmail.com` : (item.custCode ? `${item.custCode.toLowerCase()}@gmail.com` : 'tenant@gmail.com'),
        recipientName: item.namecust || item.custName || 'Tenant',
        subject: type === 'Renewal'
          ? `Lease Expiry & Renewal Proposal - Unit ${unit}`
          : `Move-Out Clearance Guidelines - Unit ${unit}`,
        body: type === 'Renewal'
          ? `Dear ${item.namecust || item.custName || 'Tenant'},\n\nYour lease for Unit ${unit} expires on ${pDate}.\nProposed annual rent: AED ${item.proposedAnnual || item.pAnnual || 0}.\n\nBest regards,\nAl-Zebaq Property Management`
          : `Dear ${item.namecust || item.custName || 'Tenant'},\n\nWe acknowledge that you do not wish to renew your lease for Unit ${unit}.\nPlease refer to the guidelines for move-out and security deposit return.\n\nSincerely,\nAl-Zebaq Admin`,
        sentDate: new Date().toISOString(),
        status: 'Sent',
        type: type,
        attachments: attachments
      });
    });

    localStorage.setItem('email_logs', JSON.stringify(logs));
  }
}
