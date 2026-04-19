import { NgModule } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TextareaModule } from 'primeng/textarea';
import { RippleModule } from 'primeng/ripple';
import { MessageService } from 'primeng/api';
import { ColorPickerModule } from 'primeng/colorpicker';
import { SliderModule } from 'primeng/slider';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { FileUploadModule } from 'primeng/fileupload';
import { ProgressBarModule } from 'primeng/progressbar';
import { MultiSelectModule } from 'primeng/multiselect';
import { CheckboxModule } from 'primeng/checkbox';
import { TieredMenuModule } from 'primeng/tieredmenu';
import { SplitButtonModule } from 'primeng/splitbutton';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { BadgeModule } from 'primeng/badge';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectButtonModule } from 'primeng/selectbutton';
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
    SelectModule,
    ToastModule,
    TooltipModule,
    TableModule,
    FloatLabelModule,
    TextareaModule,
    RippleModule,
    ColorPickerModule,
    SliderModule,
    IconFieldModule,
    InputIconModule,
    FileUploadModule,
    ProgressBarModule,
    MultiSelectModule,
    CheckboxModule,
    TieredMenuModule,
    SplitButtonModule,
    AutoCompleteModule,
    BadgeModule,
    InputNumberModule,
    SelectButtonModule
  ],
  exports: [
    InputTextModule,
    ButtonModule,
    CardModule,
    RadioButtonModule,
    SelectModule,
    ToastModule,
    TooltipModule,
    TableModule,
    FloatLabelModule,
    TextareaModule,
    RippleModule,
    ColorPickerModule,
    SliderModule, 
    IconFieldModule,
    InputIconModule,
    FileUploadModule,
    ProgressBarModule,
    MultiSelectModule,
    CheckboxModule,
    TieredMenuModule,
    SplitButtonModule,
    AutoCompleteModule,
    BadgeModule,
    InputNumberModule,
    SelectButtonModule
  ],
  providers: [
    MessageService
  ]
})
export class PrimeNgModule { } 