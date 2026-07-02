// project import
import { Component, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import {PropertyService} from '../../../../services/property.service';  

@Component({
  selector: 'app-auth-login',
  imports: [RouterModule],
  templateUrl: './auth-login.component.html',
  styleUrl: './auth-login.component.scss'
})

export class AuthLoginComponent {
  private router = inject(Router);

  onLogin() {
    this.router.navigate(['/property/setup']);
  }
}
