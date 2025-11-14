// angular import
import { Component, Input, output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../../../../theme/shared/shared.module';

// project import

@Component({
  selector: 'app-nav-logo',
  imports: [SharedModule, RouterModule],
  templateUrl: './nav-logo.component.html',
  styleUrls: ['./nav-logo.component.scss']
})
export class NavLogoComponent {
  // public props
  @Input() navCollapsed = false;
  NavCollapse = output();
  windowWidth = window.innerWidth;

  // public method
  navCollapse() {
    if (this.windowWidth >= 992) {
      this.navCollapsed = !this.navCollapsed;
      this.NavCollapse.emit();
    }
  }
}
