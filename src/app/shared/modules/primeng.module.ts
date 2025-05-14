import { NgModule } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { RadioButtonModule } from 'primeng/radiobutton';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TextareaModule } from 'primeng/textarea';
import { RippleModule } from 'primeng/ripple';
import { MessageService } from 'primeng/api';
import { ColorPickerModule } from 'primeng/colorpicker';
import { SliderModule } from 'primeng/slider';
/**
 * Общий модуль для импорта компонентов PrimeNG
 * Используется для минимизации дублирования импортов в компонентах
 */
@NgModule({
  imports: [
    InputTextModule,
    ButtonModule,
    CardModule,
    RadioButtonModule,
    DropdownModule,
    ToastModule,
    TooltipModule,
    TableModule,
    FloatLabelModule,
    TextareaModule,
    RippleModule,
    ColorPickerModule,
    SliderModule
  ],
  exports: [
    InputTextModule,
    ButtonModule,
    CardModule,
    RadioButtonModule,
    DropdownModule,
    ToastModule,
    TooltipModule,
    TableModule,
    FloatLabelModule,
    TextareaModule,
    RippleModule,
    ColorPickerModule,
    SliderModule
  ],
  providers: [
    MessageService
  ]
})
export class PrimeNgModule { } 