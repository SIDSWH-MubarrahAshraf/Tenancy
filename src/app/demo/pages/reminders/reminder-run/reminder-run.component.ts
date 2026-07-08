import { Component, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReminderService } from 'src/app/services/reminder.service';

@Component({
  selector: 'app-reminder-run',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reminder-run.component.html',
  styleUrls: ['./reminder-run.component.scss']
})
export class ReminderRunComponent {

  // Execution States
  isRunning = false;
  statusMessage = '';
  debugError = '';
  runResult: string | null = null;

  constructor(
    private reminderService: ReminderService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  // ==========================================
  // RUN REMINDER JOB
  // ==========================================
  triggerReminderJob(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.statusMessage = 'Executing reminder job...';
    this.debugError = '';
    this.runResult = null;
    this.cdr.detectChanges();

    this.reminderService.runReminderNow().subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          this.isRunning = false;
          // Combine message and data (if string) for detailed display
          let msg = response?.message || 'Reminder job completed successfully.';
          if (response?.data && typeof response.data === 'string') {
            msg += ` (${response.data})`;
          }
          this.statusMessage = msg;
          this.runResult = null;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.isRunning = false;
          this.statusMessage = '';
          console.error('Reminder job failed:', err);
          this.debugError = err.error?.message || err.message || 'An error occurred while running the reminder engine.';
          this.cdr.detectChanges();
        });
      }
    });
  }
}