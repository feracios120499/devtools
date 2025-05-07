import { NGX_MONACO_EDITOR_CONFIG } from 'ngx-monaco-editor-v2';

// Экспортируем токен, который будет использоваться только в браузерном окружении
export const MONACO_BROWSER_CONFIG = {
  provide: NGX_MONACO_EDITOR_CONFIG,
  useFactory: () => {
    // Функция фабрики позволяет отложить создание объекта до момента использования
    return {
      baseUrl: 'assets/monaco/min',
      defaultOptions: { 
        scrollBeyondLastLine: false,
        automaticLayout: true
      }
    };
  }
}; 