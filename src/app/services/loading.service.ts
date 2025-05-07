import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  // BehaviorSubject с начальным значением true (загрузка активна)
  private isLoadingSubject = new BehaviorSubject<boolean>(true);
  
  // Публичное Observable для подписки компонентов
  public isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();
  
  constructor() {
    // По умолчанию страница считается загружающейся
    console.log('LoadingService created, initial loading state: true');
  }
  
  /**
   * Устанавливает статус загрузки
   */
  setLoading(isLoading: boolean): void {
    this.isLoadingSubject.next(isLoading);
    console.log('Loading state changed to:', isLoading);
  }
  
  /**
   * Помечает загрузку как завершенную
   */
  completeLoading(): void {
    this.isLoadingSubject.next(false);
    console.log('Loading completed');
  }
  
  /**
   * Возвращает текущее значение статуса загрузки
   */
  getLoadingValue(): boolean {
    return this.isLoadingSubject.value;
  }
} 