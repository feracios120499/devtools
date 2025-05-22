import { NgModule } from '@angular/core';
import { provideTablerIcons, TablerIconComponent } from 'angular-tabler-icons';
import { IconClipboard, IconCode, IconTrash, IconCopy, IconDownload, IconArrowsMaximize, IconArrowsMinimize, IconSearch, IconQrcode, IconClearFormatting, IconExchange, IconHome, IconFileTypeXml, IconBrandDocker, IconPencilSearch, IconTable, IconUnlink, IconFileArrowRight, IconAlignLeft2, IconTransform, IconBrandReact, IconPalette, IconStar, IconStarFilled, IconAlignJustified, IconArrowRight, IconBinary, IconArrowLeft } from 'angular-tabler-icons/icons';

@NgModule({
   imports: [TablerIconComponent],
   providers: [provideTablerIcons({
      IconClipboard,
      IconCode,
      IconTrash,
      IconCopy,
      IconDownload,
      IconArrowsMaximize,
      IconArrowsMinimize,
      IconSearch,
      IconClearFormatting, 
      IconHome, 
      IconFileTypeXml, 
      IconBrandDocker, 
      IconPencilSearch, 
      IconTable, 
      IconUnlink, 
      IconQrcode, 
      IconFileArrowRight, 
      IconAlignLeft2,
      IconTransform,
      IconExchange,
      IconBrandReact,
      IconPalette,
      IconStar,
      IconStarFilled,
      IconAlignJustified,
      IconArrowRight,
      IconBinary,
      IconArrowLeft
   })],
   exports: [TablerIconComponent]
})
export class IconsModule { }

