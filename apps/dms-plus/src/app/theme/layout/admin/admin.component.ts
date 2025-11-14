// angular import
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

// project import
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { ConfigurationComponent } from './configuration/configuration.component';
import { Footer } from './footer/footer';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { NavigationComponent } from './navigation/navigation.component';

@Component({
  selector: 'app-admin',
  imports: [NavBarComponent, NavigationComponent, RouterModule, CommonModule, ConfigurationComponent, BreadcrumbsComponent, Footer],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent {
  // public props
  navCollapsed = false;
  navCollapsedMob: boolean;
  windowWidth: number;

  // constructor
  constructor() {
    this.windowWidth = window.innerWidth;
    this.navCollapsedMob = false;
  }

  // public method
  navMobClick() {
    const navElement = document.querySelector('app-navigation.pcoded-navbar');
    if (this.navCollapsedMob && navElement && !navElement.classList.contains('mob-open')) {
      this.navCollapsedMob = !this.navCollapsedMob;
      setTimeout(() => {
        this.navCollapsedMob = !this.navCollapsedMob;
      }, 100);
    } else {
      this.navCollapsedMob = !this.navCollapsedMob;
    }
  }

  // this is for eslint rule
  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeMenu();
    }
  }

  closeMenu() {
    const navElement = document.querySelector('app-navigation.pcoded-navbar');
    if (navElement && navElement.classList.contains('mob-open')) {
      navElement.classList.remove('mob-open');
    }
  }
}
