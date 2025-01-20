import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, startWith, tap } from 'rxjs/operators';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = 'https://dummyjson.com/users';
  private users$ = new BehaviorSubject<User[]>([]);
  private nameFilter$ = new BehaviorSubject<string>('');
  private cityFilter$ = new BehaviorSubject<string>('');
  private highlightOldest$ = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {
    this.loadUsers();
  }

  private loadUsers() {
    this.http.get<{ users: User[] }>(this.API_URL)
      .pipe(
        tap(response => {
          console.log('API Response:', response);
          console.log('Sample user:', response.users[0]);
        }),
        map(response => ({
          ...response,
          users: this.removeDuplicateUsers(response.users)
        }))
      )
      .subscribe({
        next: (response) => {
          this.users$.next(response.users);
          console.log('Loaded users with cities:', response.users.map(u => u.address.city));
        },
        error: (error) => console.error('Error loading users:', error)
      });
  }

  private removeDuplicateUsers(users: User[]): User[] {
    const seen = new Set<number>();
    return users.filter(user => {
      if (seen.has(user.id)) {
        return false;
      }
      seen.add(user.id);
      return true;
    });
  }

  getUsers(): Observable<User[]> {
    return this.users$;
  }

  getCities(): Observable<string[]> {
    return this.users$.pipe(
      map(users => {
        const cities = [...new Set(users.map(user => user.address.city))]
          .filter(city => city && city.trim() !== '')
          .sort();
        console.log('Available cities:', cities);
        return cities;
      })
    );
  }

  setNameFilter(name: string) {
    console.log('Setting name filter:', name);
    this.nameFilter$.next(name?.trim() || '');
  }

  setCityFilter(city: string) {
    console.log('Setting city filter:', city);
    this.cityFilter$.next(city?.trim() || '');
  }

  setHighlightOldest(highlight: boolean) {
    console.log('Setting highlight:', highlight);
    this.highlightOldest$.next(highlight);
  }

  getFilteredUsers(): Observable<User[]> {
    return combineLatest([
      this.users$,
      this.nameFilter$.pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        startWith('')
      ),
      this.cityFilter$.pipe(
        distinctUntilChanged(),
        startWith('')
      ),
      this.highlightOldest$.pipe(
        distinctUntilChanged(),
        startWith(false)
      )
    ]).pipe(
      map(([users, nameFilter, cityFilter, highlightOldest]) => {
        console.log('Starting filtering with:', { 
          nameFilter, 
          cityFilter, 
          highlightOldest,
          totalUsers: users.length 
        });

        let filteredUsers = [...users];
        
        if (nameFilter) {
          const searchTerm = nameFilter.toLowerCase();
          filteredUsers = filteredUsers.filter(user => 
            user.firstName.toLowerCase().includes(searchTerm) ||
            user.lastName.toLowerCase().includes(searchTerm)
          );
          console.log('After name filter:', filteredUsers.length, 'users');
        }

        if (cityFilter) {
          console.log('Filtering by city:', cityFilter);
          console.log('Before city filter:', filteredUsers.length, 'users');
          console.log('Sample cities:', filteredUsers.slice(0, 5).map(u => u.address.city));
          
          filteredUsers = filteredUsers.filter(user => {
            const userCity = (user.address.city || '').toLowerCase();
            const filterCity = cityFilter.toLowerCase();
            const match = userCity === filterCity;
            console.log(`Comparing: "${userCity}" with "${filterCity}" = ${match}`);
            return match;
          });
          
          console.log('After city filter:', filteredUsers.length, 'users');
        }

        if (highlightOldest) {
          const usersByCity = filteredUsers.reduce((acc, user) => {
            const city = user.address.city || 'Unknown';
            if (!acc[city]) {
              acc[city] = [];
            }
            acc[city].push(user);
            return acc;
          }, {} as { [key: string]: User[] });

          filteredUsers = filteredUsers.map(user => ({ ...user, isHighlighted: false }));

          Object.values(usersByCity).forEach(cityUsers => {
            const oldestUser = cityUsers.reduce((oldest, current) => 
              current.age > oldest.age ? current : oldest
            );
            const index = filteredUsers.findIndex(u => u.id === oldestUser.id);
            if (index !== -1) {
              filteredUsers[index] = { ...filteredUsers[index], isHighlighted: true };
            }
          });
        }

        filteredUsers = this.removeDuplicateUsers(filteredUsers);

        console.log('Final filtered users:', filteredUsers.length);
        return filteredUsers;
      })
    );
  }
}
