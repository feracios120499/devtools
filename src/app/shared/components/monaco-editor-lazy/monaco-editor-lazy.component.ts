import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  PLATFORM_ID,
  inject,
  ChangeDetectionStrategy,
  forwardRef,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { MonacoScrollFixDirective } from '../../directives/monaco-scroll-fix.directive';

// Shape of the underlying monaco-editor ref exposed to consumers that
// previously accessed `.editor` directly on the ngx-monaco-editor instance.
export interface MonacoEditorRef {
  editor?: {
    layout: () => void;
    focus?: () => void;
    getValue?: () => string;
    setValue?: (value: string) => void;
  };
}

/**
 * Reusable Monaco editor wrapper that lazy-loads the Monaco module only
 * when the browser is idle. Falls back to a plain textarea both during SSR
 * and while the editor is being hydrated on the client, which keeps the
 * user interactive even on slow networks / low-end devices.
 *
 * API mirrors ngx-monaco-editor-v2:
 *  - `[options]` forwards editor options
 *  - `[(ngModel)]` drives the underlying value via ControlValueAccessor
 *  - `(ngModelChange)` emits on every change
 *  - `editor` getter exposes the raw monaco editor instance once loaded
 */
@Component({
  selector: 'app-monaco-editor-lazy',
  standalone: true,
  imports: [CommonModule, FormsModule, MonacoEditorModule, MonacoScrollFixDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MonacoEditorLazyComponent),
      multi: true,
    },
  ],
  template: `
    @if (isBrowser) {
      @defer (on idle) {
        <ngx-monaco-editor
          #monacoEditor
          monacoScrollFix
          [options]="options"
          [ngModel]="value"
          (ngModelChange)="onValueChange($event)"
          [class]="editorClass">
        </ngx-monaco-editor>
      } @placeholder {
        <textarea
          [ngModel]="value"
          (ngModelChange)="onValueChange($event)"
          [readOnly]="readOnly"
          [class]="placeholderClass"
          spellcheck="false"></textarea>
      }
    } @else {
      <textarea
        [ngModel]="value"
        (ngModelChange)="onValueChange($event)"
        [readOnly]="readOnly"
        [class]="placeholderClass"
        spellcheck="false"></textarea>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
      /*
       * Match Monaco's vs/vs-dark surface so the textarea -> editor swap
       * (both on SSR hydration and @defer resolve) doesn't flash a different
       * background. Colors taken from monaco-editor default themes.
       */
      textarea {
        width: 100%;
        height: 100%;
        padding: 0.5rem;
        font-family: Menlo, Monaco, 'Courier New', monospace;
        font-size: 14px;
        line-height: 19px;
        resize: none;
        background: #ffffff;
        color: #000000;
        border: 0;
        border-radius: 0;
        outline: none;
        box-sizing: border-box;
      }
      :host-context(.my-app-dark) textarea {
        background: #1e1e1e;
        color: #d4d4d4;
      }
    `,
  ],
})
export class MonacoEditorLazyComponent implements ControlValueAccessor {
  @Input() options: Record<string, unknown> = {};
  @Input() editorClass = 'w-full h-full';
  @Input() placeholderClass = 'w-full h-full';
  @Input() readOnly = false;

  @Output() valueChange = new EventEmitter<string>();

  @ViewChild('monacoEditor') private monacoEditorRef?: MonacoEditorRef;

  protected value = '';
  protected readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null | undefined): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.readOnly = isDisabled;
  }

  protected onValueChange(next: string): void {
    this.value = next;
    this.onChange(next);
    this.onTouched();
    this.valueChange.emit(next);
  }

  /** Expose the raw Monaco editor once it's initialised. */
  get editor(): MonacoEditorRef['editor'] | undefined {
    return this.monacoEditorRef?.editor;
  }

  /** Convenience helper equivalent to `editor?.layout()`. */
  layout(): void {
    this.editor?.layout();
  }
}
