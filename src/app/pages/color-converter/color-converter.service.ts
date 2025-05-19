import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ColorHistoryItem } from './color-converter.types';
import { UserPreferencesService, ColorConverterSettings } from '../../services/user-preferences.service';

const MAX_HISTORY_ITEMS = 10;
const COLOR_CONVERTER_PAGE_URL = 'color-converter';

@Injectable({
  providedIn: 'root'
})
export class ColorConverterService {
  private historySubject = new BehaviorSubject<ColorHistoryItem[]>([]);

  constructor(private userPreferencesService: UserPreferencesService) {
    this.loadHistory();
  }

  // История конвертаций
  getHistory(): Observable<ColorHistoryItem[]> {
    return this.historySubject.asObservable();
  }

  addToHistory(item: ColorHistoryItem) {
    // Загружаем текущую историю
    const currentHistory = this.historySubject.value;
    
    // Проверяем на дубликаты по HEX значению цвета (нормализуем к нижнему регистру)
    const normalizedHex = item.color.toLowerCase();
    const isDuplicate = currentHistory.some(historyItem => 
      historyItem.color.toLowerCase() === normalizedHex
    );
    
    if (!isDuplicate) {
      // Добавляем новый элемент и обрезаем историю до максимального размера
      const newHistory = [item, ...currentHistory].slice(0, MAX_HISTORY_ITEMS);
      this.historySubject.next(newHistory);
      
      // Сохраняем в настройках пользователя
      this.saveHistoryToSettings(newHistory);
    }
  }

  clearHistory() {
    this.historySubject.next([]);
    
    // Загружаем текущие настройки
    const settings = this.userPreferencesService.loadPageSettings<ColorConverterSettings>(COLOR_CONVERTER_PAGE_URL);
    
    if (settings) {
      // Сохраняем выбранные колонки, если они есть
      const selectedHistoryColumns = settings['selectedHistoryColumns'];
      
      // Обновляем настройки без истории
      const updatedSettings: ColorConverterSettings = {
        ...settings,
        colorHistory: []
      };
      
      // Если были сохранены колонки, добавляем их обратно
      if (selectedHistoryColumns) {
        updatedSettings['selectedHistoryColumns'] = selectedHistoryColumns;
      }
      
      this.userPreferencesService.savePageSettings(COLOR_CONVERTER_PAGE_URL, updatedSettings);
    }
  }

  private loadHistory() {
    try {
      // Загружаем настройки
      const settings = this.userPreferencesService.loadPageSettings<ColorConverterSettings>(COLOR_CONVERTER_PAGE_URL);
      
      if (settings && settings['colorHistory']) {
        this.historySubject.next(settings['colorHistory']);
      }
    } catch (e) {
      console.error('Error loading color history:', e);
    }
  }

  private saveHistoryToSettings(history: ColorHistoryItem[]) {
    try {
      // Загружаем текущие настройки
      const settings = this.userPreferencesService.loadPageSettings<ColorConverterSettings>(COLOR_CONVERTER_PAGE_URL);
      
      if (settings) {
        // Сохраняем выбранные колонки, если они есть
        const selectedHistoryColumns = settings['selectedHistoryColumns'];
        
        // Обновляем существующие настройки
        const updatedSettings: ColorConverterSettings = {
          ...settings,
          colorHistory: history
        };
        
        // Если были сохранены колонки, добавляем их обратно
        if (selectedHistoryColumns) {
          updatedSettings['selectedHistoryColumns'] = selectedHistoryColumns;
        }
        
        this.userPreferencesService.savePageSettings(COLOR_CONVERTER_PAGE_URL, updatedSettings);
      } else {
        // Создаем новые настройки, если их нет
        const newSettings: ColorConverterSettings = {
          selectedFormat: 'HEX',
          selectedColor: '#4ade80',
          colorHistory: history
        };
        
        this.userPreferencesService.savePageSettings(COLOR_CONVERTER_PAGE_URL, newSettings);
      }
    } catch (e) {
      console.error('Error saving color history:', e);
    }
  }
} 