import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-reminders-shell',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="reminders-container">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .reminders-container {
      width: 100%;
    }
  `]
})
export class RemindersComponent {}
