import { NgModule } from '@angular/core';
import { provideTablerIcons, TablerIconComponent } from 'angular-tabler-icons';
import { IconClipboard, IconCode, IconTrash, IconCopy, IconDownload, IconArrowsMaximize, IconArrowsMinimize } from 'angular-tabler-icons/icons';

@NgModule({
   imports:[TablerIconComponent],
   providers:[provideTablerIcons({ IconClipboard, IconCode, IconTrash, IconCopy, IconDownload, IconArrowsMaximize, IconArrowsMinimize })],
   exports:[TablerIconComponent]
})
export class IconsModule { }

