import { NgModule } from '@angular/core';
import { provideTablerIcons, TablerIconComponent } from 'angular-tabler-icons';
import { IconClipboard, IconCode, IconTrash, IconCopy, IconDownload} from 'angular-tabler-icons/icons';

@NgModule({
   imports:[TablerIconComponent],
   providers:[provideTablerIcons({ IconClipboard, IconCode, IconTrash, IconCopy, IconDownload })],
   exports:[TablerIconComponent]
})
export class IconsModule { }

