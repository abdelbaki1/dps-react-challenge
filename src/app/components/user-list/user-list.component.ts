import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { User } from '../../models/user.model';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit, OnDestroy {
  users: User[] = [];
  cities: string[] = [];
  nameFilter = new FormControl('');
  cityFilter = new FormControl(null);
  highlightOldest = new FormControl(false);
  private destroy$ = new Subject<void>();

  constructor(private userService: UserService) {}

  ngOnInit() {
    // Initialize filters with default values
    this.userService.setNameFilter('');
    this.userService.setCityFilter('');
    this.userService.setHighlightOldest(false);

    // Subscribe to filtered users
    this.userService.getFilteredUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe(users => {
        console.log('Received filtered users:', users.length);
        this.users = users;
      });

    // Get available cities
    this.userService.getCities()
      .pipe(takeUntil(this.destroy$))
      .subscribe(cities => {
        console.log('Received cities:', cities);
        this.cities = cities;
      });

    // Set up filter subscriptions
    this.nameFilter.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        console.log('Name filter changed:', value);
        this.userService.setNameFilter(value || '');
      });

    this.cityFilter.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        console.log('City filter changed:', value);
        this.userService.setCityFilter(value || '');
      });

    this.highlightOldest.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        console.log('Highlight changed:', value);
        this.userService.setHighlightOldest(value);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getFullName(user: User): string {
    return `${user.firstName} ${user.lastName}`;
  }

  trackByUserId(index: number, user: User): number {
    return user.id;
  }
}
