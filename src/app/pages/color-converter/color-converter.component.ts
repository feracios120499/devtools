import { Component, OnInit, Inject, PLATFORM_ID, Renderer2, HostBinding, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { MessageService } from 'primeng/api';

import { ThemeService } from '../../services/theme.service';
import { PageTitleService } from '../../services/page-title.service';
import { PrimeNgModule } from '../../shared/modules/primeng.module';
import { UserPreferencesService, ColorConverterSettings } from '../../services/user-preferences.service';
import { ColorConverterService } from './color-converter.service';
import { ColorFormat, ColorHistoryItem } from './color-converter.types';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { SeoService, MetaData } from '../../services/seo.service';

@Component({
    selector: 'app-color-converter',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        PrimeNgModule,
        PageHeaderComponent
    ],
    providers: [MessageService],
    templateUrl: './color-converter.component.html',
    styleUrl: './color-converter.component.scss'
})
export class ColorConverterComponent implements OnInit, OnDestroy {
    @HostBinding('class') class = 'dt-page';
    // Цветовые форматы
    colorFormats: string[] = ['HEX', 'RGB', 'RGBA', 'HSL', 'HSV', 'HSB', 'HWB', 'CMYK', 'LCH', 'LAB'];
    selectedFormat: string = 'HEX';

    // Значение выбранного цвета
    selectedColor: string = '#4ade80'; // Начальный цвет (primary)
    inputColorValue: string = ''; // Значение, введенное пользователем
    inputError: string = ''; // Сообщение об ошибке ввода

    // История конвертаций
    colorHistory: ColorHistoryItem[] = [];

    // Для таблицы истории
    historyColumns: any[] = [];
    selectedHistoryColumns: any[] = [];

    // Примеры форматов для подсказок
    private formatExamples: { [key: string]: string } = {
        'HEX': '#4ade80 or 4ade80',
        'RGB': 'rgb(74, 222, 128)',
        'RGBA': 'rgba(74, 222, 128, 1)',
        'HSL': 'hsl(142, 69%, 58%)',
        'HSV': 'hsv(142, 67%, 87%)',
        'HSB': 'hsb(142, 67%, 87%)',
        'HWB': 'hwb(142, 29%, 13%)',
        'CMYK': 'cmyk(67%, 0%, 42%, 13%)',
        'LCH': 'lch(80, 54, 142)',
        'LAB': 'lab(80, -47, 39)'
    };

    // Хранилище для конвертированных цветов
    convertedColors: ColorFormat[] = [];

    // Flag for browser checks
    isBrowser: boolean;

    constructor(
        @Inject(PLATFORM_ID) private platformId: Object,
        @Inject(DOCUMENT) private document: Document,
        private renderer: Renderer2,
        private themeService: ThemeService,
        private pageTitleService: PageTitleService,
        private metaService: Meta,
        private titleService: Title,
        private messageService: MessageService,
        private userPreferencesService: UserPreferencesService,
        private colorConverterService: ColorConverterService,
        private seoService: SeoService
    ) {
        this.isBrowser = isPlatformBrowser(this.platformId);
    }

    ngOnInit() {
        // Устанавливаем заголовок страницы
        this.pageTitleService.setTitle('Color Converter');
        
        // Настройка SEO
        this.setupSeo();


        // Загружаем сохраненные настройки
        this.loadSettings();

        // Инициализируем конвертированные цвета
        this.convertColor();

        // Инициализируем значение в инпуте
        this.updateInputValue();

        // Подписка на историю
        this.colorConverterService.getHistory().subscribe(history => {
            this.colorHistory = history;
        });

        // Инициализация колонок для таблицы истории
        this.initHistoryColumns();
    }

    ngOnDestroy() {
        // Очищаем SEO элементы
        this.seoService.destroy();
    }

    /**
     * Настройка SEO для страницы
     */
    private setupSeo() {
        const metaData: MetaData = {
            OgTitle: 'Color Converter | DevTools',
            OgDescription: 'Free online color converter tool. Convert colors between HEX, RGB, HSL, and HSV formats with live preview and color picker.',
            description: 'Free online color converter. Easily convert colors between different formats including HEX, RGB, HSL, and HSV. Includes a color picker and live preview of selected colors. Perfect for developers and designers.',
            keywords: ['color converter', 'hex to rgb', 'rgb to hex', 'hsl converter', 'hsv converter', 'color format converter', 'web color tools', 'color picker', 'color code converter'],
            jsonLd: {
                name: 'Color Converter',
                description: 'Online tool to convert colors between different formats including HEX, RGB, HSL, and HSV',
                url: 'https://onlinewebdevtools.com/color-converter'
            }
        };
        
        this.seoService.setupSeo(metaData);
    }

    /**
     * Загружает сохраненные настройки
     */
    private loadSettings() {
        const settings = this.userPreferencesService.loadPageSettings<ColorConverterSettings>('color-converter');
        if (settings) {
            this.selectedFormat = settings.selectedFormat;
            this.selectedColor = settings.selectedColor;

            // Загрузка сохраненных колонок (только после инициализации historyColumns)
            if (settings['selectedHistoryColumns'] && settings['selectedHistoryColumns'].length > 0) {
                // Сохраняем для применения после инициализации колонок
                this.applySelectedColumnsAfterInit = settings['selectedHistoryColumns'];
            }
        }
    }

    /**
     * Применяет сохраненные колонки после инициализации
     */
    private applySelectedColumnsAfterInit: string[] | null = null;

    /**
     * Сохраняет текущие настройки
     */
    private saveSettings() {
        // Загружаем текущие настройки, чтобы сохранить историю
        const existingSettings = this.userPreferencesService.loadPageSettings<ColorConverterSettings>('color-converter');

        // Создаем новые настройки с текущими значениями формата и цвета
        const settings: ColorConverterSettings = {
            selectedFormat: this.selectedFormat,
            selectedColor: this.selectedColor
        };

        // Сохраняем существующую историю, если она есть
        if (existingSettings && existingSettings['colorHistory']) {
            settings['colorHistory'] = existingSettings['colorHistory'];
        }

        // Сохраняем существующие выбранные колонки, если они есть
        if (existingSettings && existingSettings['selectedHistoryColumns']) {
            settings['selectedHistoryColumns'] = existingSettings['selectedHistoryColumns'];
        }
        // Если нет существующих настроек колонок, но есть текущие выбранные колонки
        else if (this.selectedHistoryColumns && this.selectedHistoryColumns.length > 0) {
            settings['selectedHistoryColumns'] = this.selectedHistoryColumns.map(col => col.field);
        }

        this.userPreferencesService.savePageSettings('color-converter', settings);
    }

    /**
     * Обработчик изменения цвета в color picker
     */
    onColorChange() {
        this.convertColor();
        this.updateInputValue();
        this.saveSettings();
    }

    /**
     * Обработчик изменения формата цвета
     */
    onFormatChange() {
        this.inputError = '';
        this.convertColor();
        this.updateInputValue();
        this.saveSettings();
    }

    /**
     * Обработчик изменения текстового значения цвета
     */
    onInputChange() {
        // Если ввод пустой, очищаем ошибку
        if (!this.inputColorValue) {
            this.inputError = '';
            return;
        }

        try {
            // В зависимости от выбранного формата парсим ввод и устанавливаем цвет
            switch (this.selectedFormat) {
                case 'HEX':
                    // Валидация и нормализация HEX
                    const hexValue = this.inputColorValue.replace('#', '');
                    if (/^([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.test(hexValue)) {
                        let hex = '#' + hexValue;
                        if (hex.length === 4) {
                            hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
                        }
                        this.selectedColor = hex;
                        this.inputError = '';
                        this.saveSettings(); // Сохраняем настройки при успешном вводе
                    } else {
                        this.inputError = `Example format: ${this.formatExamples['HEX']}`;
                    }
                    break;

                case 'RGB':
                    const rgbMatch = this.inputColorValue.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
                    if (rgbMatch) {
                        const r = Math.min(255, parseInt(rgbMatch[1]));
                        const g = Math.min(255, parseInt(rgbMatch[2]));
                        const b = Math.min(255, parseInt(rgbMatch[3]));
                        this.selectedColor = this.rgbToHex(r, g, b);
                        this.inputError = '';
                        this.saveSettings();
                    } else {
                        this.inputError = `Example format: ${this.formatExamples['RGB']}`;
                    }
                    break;

                case 'RGBA':
                    const rgbaMatch = this.inputColorValue.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*(0?\.\d+|1(\.0)?)\)$/);
                    if (rgbaMatch) {
                        const r = Math.min(255, parseInt(rgbaMatch[1]));
                        const g = Math.min(255, parseInt(rgbaMatch[2]));
                        const b = Math.min(255, parseInt(rgbaMatch[3]));
                        this.selectedColor = this.rgbToHex(r, g, b);
                        this.inputError = '';
                        this.saveSettings();
                    } else {
                        this.inputError = `Example format: ${this.formatExamples['RGBA']}`;
                    }
                    break;

                case 'HSL':
                    const hslMatch = this.inputColorValue.match(/^hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)$/);
                    if (hslMatch) {
                        const h = parseInt(hslMatch[1]) % 360;
                        const s = Math.min(100, parseInt(hslMatch[2])) / 100;
                        const l = Math.min(100, parseInt(hslMatch[3])) / 100;
                        this.selectedColor = this.hslToHex(h, s, l);
                        this.inputError = '';
                        this.saveSettings();
                    } else {
                        this.inputError = `Example format: ${this.formatExamples['HSL']}`;
                    }
                    break;

                case 'HSV':
                case 'HSB':
                    const format = this.selectedFormat.toLowerCase();
                    const hsvMatch = this.inputColorValue.match(new RegExp(`^${format}\\((\\d+),\\s*(\\d+)%,\\s*(\\d+)%\\)$`));
                    if (hsvMatch) {
                        const h = parseInt(hsvMatch[1]) % 360;
                        const s = Math.min(100, parseInt(hsvMatch[2])) / 100;
                        const v = Math.min(100, parseInt(hsvMatch[3])) / 100;
                        const rgb = this.hsvToRgb(h, s, v);
                        this.selectedColor = this.rgbToHex(rgb.r, rgb.g, rgb.b);
                        this.inputError = '';
                        this.saveSettings();
                    } else {
                        this.inputError = `Example format: ${this.formatExamples[this.selectedFormat]}`;
                    }
                    break;

                case 'HWB':
                    const hwbMatch = this.inputColorValue.match(/^hwb\((\d+),\s*(\d+)%,\s*(\d+)%\)$/);
                    if (hwbMatch) {
                        const h = parseInt(hwbMatch[1]) % 360;
                        const w = Math.min(100, parseInt(hwbMatch[2])) / 100;
                        const b = Math.min(100, parseInt(hwbMatch[3])) / 100;
                        const s = 1 - w / (1 - b);
                        const v = 1 - b;
                        const rgb = this.hsvToRgb(h, s, v);
                        this.selectedColor = this.rgbToHex(rgb.r, rgb.g, rgb.b);
                        this.inputError = '';
                        this.saveSettings();
                    } else {
                        this.inputError = `Example format: ${this.formatExamples['HWB']}`;
                    }
                    break;

                case 'CMYK':
                    const cmykMatch = this.inputColorValue.match(/^cmyk\((\d+)%,\s*(\d+)%,\s*(\d+)%,\s*(\d+)%\)$/);
                    if (cmykMatch) {
                        const c = Math.min(100, parseInt(cmykMatch[1])) / 100;
                        const m = Math.min(100, parseInt(cmykMatch[2])) / 100;
                        const y = Math.min(100, parseInt(cmykMatch[3])) / 100;
                        const k = Math.min(100, parseInt(cmykMatch[4])) / 100;
                        const r = Math.round(255 * (1 - c) * (1 - k));
                        const g = Math.round(255 * (1 - m) * (1 - k));
                        const b = Math.round(255 * (1 - y) * (1 - k));
                        this.selectedColor = this.rgbToHex(r, g, b);
                        this.inputError = '';
                        this.saveSettings();
                    } else {
                        this.inputError = `Example format: ${this.formatExamples['CMYK']}`;
                    }
                    break;

                case 'LCH':
                    const lchMatch = this.inputColorValue.match(/^lch\((\d+),\s*(\d+),\s*(\d+)\)$/);
                    if (lchMatch) {
                        const l = Math.min(100, parseInt(lchMatch[1]));
                        const c = parseInt(lchMatch[2]);
                        const h = parseInt(lchMatch[3]) % 360;
                        const rgb = this.lchToRgb(l, c, h);
                        this.selectedColor = this.rgbToHex(rgb.r, rgb.g, rgb.b);
                        this.inputError = '';
                        this.saveSettings();
                    } else {
                        this.inputError = `Example format: ${this.formatExamples['LCH']}`;
                    }
                    break;

                case 'LAB':
                    const labMatch = this.inputColorValue.match(/^lab\((\d+),\s*(-?\d+),\s*(-?\d+)\)$/);
                    if (labMatch) {
                        const l = Math.min(100, parseInt(labMatch[1]));
                        const a = parseInt(labMatch[2]);
                        const b = parseInt(labMatch[3]);
                        const rgb = this.labToRgb(l, a, b);
                        this.selectedColor = this.rgbToHex(rgb.r, rgb.g, rgb.b);
                        this.inputError = '';
                        this.saveSettings();
                    } else {
                        this.inputError = `Example format: ${this.formatExamples['LAB']}`;
                    }
                    break;
            }

            if (!this.inputError) {
                this.convertColor();
            }
        } catch (e) {
            console.error('Error parsing color input:', e);
            this.inputError = `Example format: ${this.formatExamples[this.selectedFormat]}`;
        }
    }

    /**
     * Обновляет значение в поле ввода на основе текущего цвета и формата
     */
    private updateInputValue() {
        const formatObj = this.convertedColors.find(format => format.name === this.selectedFormat);
        if (formatObj) {
            this.inputColorValue = formatObj.value;
            this.inputError = '';
        }
    }

    /**
     * Конвертирует текущий выбранный цвет во все форматы
     */
    convertColor() {
        try {
            const hex = this.selectedColor;
            const rgb = this.hexToRgb(hex);

            if (!rgb) {
                throw new Error('Invalid color');
            }

            const { r, g, b } = rgb;
            const hsl = this.rgbToHsl(r, g, b);
            const hsv = this.rgbToHsv(r, g, b);
            const hwb = this.rgbToHwb(r, g, b);
            const cmyk = this.rgbToCmyk(r, g, b);
            const lch = this.rgbToLch(r, g, b);
            const lab = this.rgbToLab(r, g, b);

            // Форматирование результатов
            this.convertedColors = [
                { name: 'HEX', value: hex, display: hex },
                { name: 'RGB', value: `rgb(${r}, ${g}, ${b})`, display: `rgb(${r}, ${g}, ${b})` },
                { name: 'RGBA', value: `rgba(${r}, ${g}, ${b}, 1)`, display: `rgba(${r}, ${g}, ${b}, 1)` },
                {
                    name: 'HSL', value: `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%)`,
                    display: `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%)`
                },
                {
                    name: 'HSV', value: `hsv(${Math.round(hsv.h)}, ${Math.round(hsv.s * 100)}%, ${Math.round(hsv.v * 100)}%)`,
                    display: `hsv(${Math.round(hsv.h)}, ${Math.round(hsv.s * 100)}%, ${Math.round(hsv.v * 100)}%)`
                },
                {
                    name: 'HSB', value: `hsb(${Math.round(hsv.h)}, ${Math.round(hsv.s * 100)}%, ${Math.round(hsv.v * 100)}%)`,
                    display: `hsb(${Math.round(hsv.h)}, ${Math.round(hsv.s * 100)}%, ${Math.round(hsv.v * 100)}%)`
                },
                {
                    name: 'HWB', value: `hwb(${Math.round(hwb.h)}, ${Math.round(hwb.w * 100)}%, ${Math.round(hwb.b * 100)}%)`,
                    display: `hwb(${Math.round(hwb.h)}, ${Math.round(hwb.w * 100)}%, ${Math.round(hwb.b * 100)}%)`
                },
                {
                    name: 'CMYK', value: `cmyk(${Math.round(cmyk.c * 100)}%, ${Math.round(cmyk.m * 100)}%, ${Math.round(cmyk.y * 100)}%, ${Math.round(cmyk.k * 100)}%)`,
                    display: `cmyk(${Math.round(cmyk.c * 100)}%, ${Math.round(cmyk.m * 100)}%, ${Math.round(cmyk.y * 100)}%, ${Math.round(cmyk.k * 100)}%)`
                },
                {
                    name: 'LCH', value: `lch(${Math.round(lch.l)}, ${Math.round(lch.c)}, ${Math.round(lch.h)})`,
                    display: `lch(${Math.round(lch.l)}, ${Math.round(lch.c)}, ${Math.round(lch.h)})`
                },
                {
                    name: 'LAB', value: `lab(${Math.round(lab.l)}, ${Math.round(lab.a)}, ${Math.round(lab.b)})`,
                    display: `lab(${Math.round(lab.l)}, ${Math.round(lab.a)}, ${Math.round(lab.b)})`
                }
            ];
        } catch (e) {
            console.error('Color conversion error:', e);
        }
    }

    /**
     * Инициализирует колонки для таблицы истории
     */
    private initHistoryColumns() {
        // Базовые колонки всегда отображаются
        const baseColumns = [
            { field: 'timestamp', header: 'Date & Time' },
            { field: 'color', header: 'Color' }
        ];

        // Колонки с цветовыми форматами (исключая HEX)
        const formatColumns = this.colorFormats
            .filter(format => format !== 'HEX')
            .map(format => {
                return { field: format, header: format };
            });

        // Общий список колонок
        this.historyColumns = [...baseColumns, ...formatColumns];

        // По умолчанию выбраны все колонки
        this.selectedHistoryColumns = [...this.historyColumns];

        // Применяем сохраненные настройки колонок, если они есть
        if (this.applySelectedColumnsAfterInit && this.applySelectedColumnsAfterInit.length > 0) {
            const savedColumnFields = this.applySelectedColumnsAfterInit;
            this.selectedHistoryColumns = this.historyColumns.filter(col =>
                savedColumnFields.includes(col.field)
            );

            // Сбрасываем временное хранение
            this.applySelectedColumnsAfterInit = null;
        }
    }

    /**
     * Обработчик изменения выбранных колонок в таблице
     */
    onHistoryColumnChange() {
        // Сохраняем только выбранные колонки, не затрагивая историю
        if (this.selectedHistoryColumns && this.selectedHistoryColumns.length > 0) {
            // Получаем текущие настройки
            const settings = this.userPreferencesService.loadPageSettings<ColorConverterSettings>('color-converter');

            if (settings) {
                // Обновляем только поле selectedHistoryColumns
                settings['selectedHistoryColumns'] = this.selectedHistoryColumns.map(col => col.field);

                // Сохраняем обновленные настройки
                this.userPreferencesService.savePageSettings('color-converter', settings);
            } else {
                // Если настроек еще нет, создаем новые с текущими значениями
                this.saveSettings();
            }
        }
    }

    /**
     * Копирует значение цвета в буфер обмена и добавляет в историю
     */
    copyColorValue(color: ColorFormat) {
        if (this.isBrowser) {
            navigator.clipboard.writeText(color.value).then(() => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Copied!',
                    detail: `${color.name} color copied to clipboard`,
                    life: 3000
                });

                // Добавляем в историю
                this.addToHistory(color.name);
            }).catch(err => {
                console.error('Could not copy text: ', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to copy to clipboard',
                    life: 3000
                });
            });
        }
    }

    /**
     * Добавляет текущую конвертацию в историю
     */
    private addToHistory(format: string) {
        // Создаем объект для значений всех форматов
        const values: { [key: string]: string } = {};

        // Заполняем значения из конвертированных цветов
        this.convertedColors.forEach(color => {
            values[color.name] = color.value;
        });

        // Создаем уникальный ID на основе времени
        const id = `color-${Date.now()}`;

        const historyItem: ColorHistoryItem = {
            id,
            color: this.selectedColor,
            format,
            timestamp: Date.now(),
            values
        };

        this.colorConverterService.addToHistory(historyItem);
    }

    /**
     * Загружает цвет из истории
     */
    loadFromHistory(item: ColorHistoryItem) {
        this.selectedColor = item.color;
        this.selectedFormat = item.format;
        this.convertColor();
        this.updateInputValue();
    }

    /**
     * Очищает историю конвертаций
     */
    clearHistory() {
        this.colorConverterService.clearHistory();
        this.messageService.add({
            severity: 'info',
            summary: 'History cleared',
            detail: 'Conversion history has been cleared',
            life: 3000
        });
    }

    /**
     * Форматирует дату и время для отображения в таблице
     */
    formatDateTime(timestamp: number): string {
        if (!timestamp) return '';
        return new Date(timestamp).toLocaleString();
    }

    // === Вспомогательные функции для конвертации цветов ===

    /**
     * Конвертирует HEX в RGB
     */
    hexToRgb(hex: string): { r: number, g: number, b: number } | null {
        // Проверка корректности HEX и удаление #
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * Конвертирует RGB в HEX
     */
    rgbToHex(r: number, g: number, b: number): string {
        return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
    }

    /**
     * Конвертирует RGB в HSL
     */
    rgbToHsl(r: number, g: number, b: number): { h: number, s: number, l: number } {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }

            h /= 6;
        }

        return { h: h * 360, s, l };
    }

    /**
     * Конвертирует HSL в HEX
     */
    hslToHex(h: number, s: number, l: number): string {
        h /= 360;
        let r, g, b;

        if (s === 0) {
            r = g = b = l; // Ахроматический цвет (оттенки серого)
        } else {
            const hue2rgb = (p: number, q: number, t: number) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;

            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        return this.rgbToHex(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));
    }

    /**
     * Конвертирует RGB в HSV (также HSB)
     */
    rgbToHsv(r: number, g: number, b: number): { h: number, s: number, v: number } {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0, s = 0, v = max;

        const d = max - min;
        s = max === 0 ? 0 : d / max;

        if (max !== min) {
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }

            h /= 6;
        }

        return { h: h * 360, s, v };
    }

    /**
     * Конвертирует HSV/HSB в RGB
     */
    hsvToRgb(h: number, s: number, v: number): { r: number, g: number, b: number } {
        h /= 360;
        let r = 0, g = 0, b = 0;

        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const p = v * (1 - s);
        const q = v * (1 - f * s);
        const t = v * (1 - (1 - f) * s);

        switch (i % 6) {
            case 0: r = v; g = t; b = p; break;
            case 1: r = q; g = v; b = p; break;
            case 2: r = p; g = v; b = t; break;
            case 3: r = p; g = q; b = v; break;
            case 4: r = t; g = p; b = v; break;
            case 5: r = v; g = p; b = q; break;
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    /**
     * Конвертирует RGB в HWB
     */
    rgbToHwb(r: number, g: number, b: number): { h: number, w: number, b: number } {
        r /= 255;
        g /= 255;
        b /= 255;

        const hsv = this.rgbToHsv(r * 255, g * 255, b * 255);
        const w = (1 - hsv.s) * hsv.v;
        const black = 1 - hsv.v;

        return { h: hsv.h, w, b: black };
    }

    /**
     * Конвертирует RGB в CMYK
     */
    rgbToCmyk(r: number, g: number, b: number): { c: number, m: number, y: number, k: number } {
        // Нормализуем значения RGB в диапазон 0-1
        r /= 255;
        g /= 255;
        b /= 255;

        // Вычисляем значение K (черный)
        const k = 1 - Math.max(r, g, b);

        // Если k равен 1, то это чисто черный цвет
        if (k === 1) {
            return { c: 0, m: 0, y: 0, k: 1 };
        }

        // Вычисляем значения для CMY
        const c = (1 - r - k) / (1 - k);
        const m = (1 - g - k) / (1 - k);
        const y = (1 - b - k) / (1 - k);

        return { c, m, y, k };
    }

    /**
     * Конвертирует RGB в LCH
     * Примечание: это упрощенная реализация, которая сначала преобразует в Lab, а затем в LCH
     */
    rgbToLch(r: number, g: number, b: number): { l: number, c: number, h: number } {
        // Сначала преобразуем RGB в XYZ
        r /= 255;
        g /= 255;
        b /= 255;

        // Применим гамма-коррекцию
        r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
        g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
        b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

        // Преобразование RGB в XYZ
        const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
        const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
        const z = r * 0.0193 + g * 0.1192 + b * 0.9505;

        // Преобразование XYZ в Lab
        // Значения эталонного белого для D65
        const xn = 0.95047;
        const yn = 1.0;
        const zn = 1.08883;

        const xr = x / xn;
        const yr = y / yn;
        const zr = z / zn;

        const fx = xr > 0.008856 ? Math.pow(xr, 1 / 3) : (7.787 * xr) + 16 / 116;
        const fy = yr > 0.008856 ? Math.pow(yr, 1 / 3) : (7.787 * yr) + 16 / 116;
        const fz = zr > 0.008856 ? Math.pow(zr, 1 / 3) : (7.787 * zr) + 16 / 116;

        const l = 116 * fy - 16;
        const a = 500 * (fx - fy);
        const bb = 200 * (fy - fz);

        // Преобразование Lab в LCH
        const c = Math.sqrt(a * a + bb * bb);
        let h = Math.atan2(bb, a) * (180 / Math.PI);

        // Нормализация угла h в диапазоне [0, 360)
        if (h < 0) h += 360;

        return { l, c, h };
    }

    /**
     * Конвертирует LCH в RGB
     */
    lchToRgb(l: number, c: number, h: number): { r: number, g: number, b: number } {
        // Преобразование LCH в Lab
        const a = c * Math.cos(h * (Math.PI / 180));
        const bb = c * Math.sin(h * (Math.PI / 180));

        // Преобразование Lab в XYZ
        const fy = (l + 16) / 116;
        const fx = a / 500 + fy;
        const fz = fy - bb / 200;

        const xr = fx > 0.206893 ? Math.pow(fx, 3) : (fx - 16 / 116) / 7.787;
        const yr = l > 8 ? Math.pow(fy, 3) : l / 903.3;
        const zr = fz > 0.206893 ? Math.pow(fz, 3) : (fz - 16 / 116) / 7.787;

        // Значения эталонного белого для D65
        const xn = 0.95047;
        const yn = 1.0;
        const zn = 1.08883;

        const x = xr * xn;
        const y = yr * yn;
        const z = zr * zn;

        // Преобразование XYZ в RGB
        let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
        let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
        let b = x * 0.0557 + y * -0.2040 + z * 1.0570;

        // Применим обратную гамма-коррекцию
        r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
        g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
        b = b > 0.0031308 ? 1.055 * Math.pow(b, 1 / 2.4) - 0.055 : 12.92 * b;

        // Обрезаем значения в диапазоне [0, 1] и масштабируем до [0, 255]
        r = Math.min(Math.max(0, r), 1) * 255;
        g = Math.min(Math.max(0, g), 1) * 255;
        b = Math.min(Math.max(0, b), 1) * 255;

        return {
            r: Math.round(r),
            g: Math.round(g),
            b: Math.round(b)
        };
    }

    /**
     * Конвертирует RGB в LAB
     */
    rgbToLab(r: number, g: number, b: number): { l: number, a: number, b: number } {
        // Сначала преобразуем RGB в XYZ
        let rr = r / 255;
        let gg = g / 255;
        let bTemp = b / 255;

        // Применим гамма-коррекцию
        rr = rr > 0.04045 ? Math.pow((rr + 0.055) / 1.055, 2.4) : rr / 12.92;
        gg = gg > 0.04045 ? Math.pow((gg + 0.055) / 1.055, 2.4) : gg / 12.92;
        bTemp = bTemp > 0.04045 ? Math.pow((bTemp + 0.055) / 1.055, 2.4) : bTemp / 12.92;

        // Преобразование RGB в XYZ
        const x = rr * 0.4124 + gg * 0.3576 + bTemp * 0.1805;
        const y = rr * 0.2126 + gg * 0.7152 + bTemp * 0.0722;
        const z = rr * 0.0193 + gg * 0.1192 + bTemp * 0.9505;

        // Преобразование XYZ в Lab
        // Значения эталонного белого для D65
        const xn = 0.95047;
        const yn = 1.0;
        const zn = 1.08883;

        const xr = x / xn;
        const yr = y / yn;
        const zr = z / zn;

        const fx = xr > 0.008856 ? Math.pow(xr, 1 / 3) : (7.787 * xr) + 16 / 116;
        const fy = yr > 0.008856 ? Math.pow(yr, 1 / 3) : (7.787 * yr) + 16 / 116;
        const fz = zr > 0.008856 ? Math.pow(zr, 1 / 3) : (7.787 * zr) + 16 / 116;

        const l = 116 * fy - 16;
        const a = 500 * (fx - fy);
        const bValue = 200 * (fy - fz);

        return { l, a, b: bValue };
    }

    /**
     * Конвертирует LAB в RGB
     */
    labToRgb(l: number, a: number, b: number): { r: number, g: number, b: number } {
        // Преобразование Lab в XYZ
        const fy = (l + 16) / 116;
        const fx = a / 500 + fy;
        const fz = fy - b / 200;

        const xr = fx > 0.206893 ? Math.pow(fx, 3) : (fx - 16 / 116) / 7.787;
        const yr = l > 8 ? Math.pow(fy, 3) : l / 903.3;
        const zr = fz > 0.206893 ? Math.pow(fz, 3) : (fz - 16 / 116) / 7.787;

        // Значения эталонного белого для D65
        const xn = 0.95047;
        const yn = 1.0;
        const zn = 1.08883;

        const x = xr * xn;
        const y = yr * yn;
        const z = zr * zn;

        // Преобразование XYZ в RGB
        let rValue = x * 3.2406 + y * -1.5372 + z * -0.4986;
        let gValue = x * -0.9689 + y * 1.8758 + z * 0.0415;
        let bValue = x * 0.0557 + y * -0.2040 + z * 1.0570;

        // Применим обратную гамма-коррекцию
        rValue = rValue > 0.0031308 ? 1.055 * Math.pow(rValue, 1 / 2.4) - 0.055 : 12.92 * rValue;
        gValue = gValue > 0.0031308 ? 1.055 * Math.pow(gValue, 1 / 2.4) - 0.055 : 12.92 * gValue;
        bValue = bValue > 0.0031308 ? 1.055 * Math.pow(bValue, 1 / 2.4) - 0.055 : 12.92 * bValue;

        // Обрезаем значения в диапазоне [0, 1] и масштабируем до [0, 255]
        rValue = Math.min(Math.max(0, rValue), 1) * 255;
        gValue = Math.min(Math.max(0, gValue), 1) * 255;
        bValue = Math.min(Math.max(0, bValue), 1) * 255;

        return {
            r: Math.round(rValue),
            g: Math.round(gValue),
            b: Math.round(bValue)
        };
    }
} 