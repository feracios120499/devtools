import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostBinding,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { MessageService, TreeNode } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TreeModule } from 'primeng/tree';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { TagModule } from 'primeng/tag';

import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { PageTitleService } from '../../services/page-title.service';
import { SeoService, MetaData } from '../../services/seo.service';
import { IconsModule } from '../../shared/modules/icons.module';
import { AnchorHeadingDirective } from '../../directives/anchor-heading.directive';

import { oidShortName, resolveOid } from './oid-dictionary';

// Summary row shown in the "Decoded structure" card. One row = one key/value pair.
interface SummaryRow {
  label: string;
  value: string;
  mono?: boolean;
  noCopy?: boolean; // if true, do not render the per-row copy button
}

// Summary section is a labelled group of rows (e.g. "Subject", "Issuer",
// "Validity", "Extensions") shown underneath the detected-type badge.
interface SummarySection {
  title: string;
  rows: SummaryRow[];
  // Optional group key — consecutive sections sharing the same key render
  // inside one visually unified card (used for per-signer info blocks).
  group?: string;
}

// Visual group of summary sections rendered as a single card in the UI.
interface SummaryGroup {
  // Optional group heading (e.g. "Signer #1"). Undefined → no heading.
  title?: string;
  sections: SummarySection[];
}

// Search suggestion for the "Jump to offset" autocomplete. Precomputed at
// parse time by walking the asn1js tree so it stays cheap even for large
// PKCS#7 structures with thousands of nodes.
interface SearchSuggestion {
  offset: number;
  length: number;
  label: string; // Display label in the dropdown (offset + block name).
  path: number[]; // Indices through valueBlock.value from root to target node.
}

// Result of a single decoded block (one PEM block, one uploaded file, etc.).
interface DecodedBlock {
  label: string; // Human-readable label ("Certificate", "RSA Private Key" ...)
  detectedType: string; // Technical detected type used to drive the summary
  summary: SummarySection[]; // Flat sections (internal).
  summaryGroups: SummaryGroup[]; // Grouped sections consumed by the template.
  tree: TreeNode[];
  byteLength: number;
  searchIndex: SearchSuggestion[]; // Full index of every node for search.
  searchSuggestions: SearchSuggestion[]; // Current autocomplete suggestions.
  searchModel: SearchSuggestion | string | null; // ngModel for p-autoComplete.
}

// Mapping from PEM header label -> technical detected type the summary builder
// knows how to render. Labels not in this map fall back to generic ASN.1 tree.
const PEM_LABEL_TO_TYPE: Record<string, string> = {
  'CERTIFICATE': 'Certificate',
  'TRUSTED CERTIFICATE': 'Certificate',
  'X509 CERTIFICATE': 'Certificate',
  'CERTIFICATE REQUEST': 'CertificationRequest',
  'NEW CERTIFICATE REQUEST': 'CertificationRequest',
  'PRIVATE KEY': 'PrivateKeyInfo',
  'ENCRYPTED PRIVATE KEY': 'EncryptedPrivateKey',
  'PUBLIC KEY': 'PublicKeyInfo',
  'RSA PRIVATE KEY': 'RSAPrivateKey',
  'RSA PUBLIC KEY': 'RSAPublicKey',
  'EC PRIVATE KEY': 'ECPrivateKey',
  'DSA PRIVATE KEY': 'DSAPrivateKey',
  'PKCS7': 'ContentInfo',
  'CMS': 'ContentInfo',
  'X509 CRL': 'CertificateRevocationList',
};

// Universal-class ASN.1 tag numbers to their display names. Context/Application
// tags are not in this table — they get formatted as "[n]" in the tree.
const UNIVERSAL_TAG_NAMES: Record<number, string> = {
  0: 'EOC',
  1: 'BOOLEAN',
  2: 'INTEGER',
  3: 'BIT STRING',
  4: 'OCTET STRING',
  5: 'NULL',
  6: 'OBJECT IDENTIFIER',
  7: 'ObjectDescriptor',
  8: 'EXTERNAL',
  9: 'REAL',
  10: 'ENUMERATED',
  11: 'EMBEDDED PDV',
  12: 'UTF8String',
  13: 'RELATIVE-OID',
  16: 'SEQUENCE',
  17: 'SET',
  18: 'NumericString',
  19: 'PrintableString',
  20: 'T61String',
  21: 'VideotexString',
  22: 'IA5String',
  23: 'UTCTime',
  24: 'GeneralizedTime',
  25: 'GraphicString',
  26: 'VisibleString',
  27: 'GeneralString',
  28: 'UniversalString',
  29: 'CHARACTER STRING',
  30: 'BMPString',
};

// Friendly names for the bits of the X.509 KeyUsage BIT STRING.
const KEY_USAGE_BITS = [
  'digitalSignature',
  'nonRepudiation',
  'keyEncipherment',
  'dataEncipherment',
  'keyAgreement',
  'keyCertSign',
  'cRLSign',
  'encipherOnly',
  'decipherOnly',
];

// Sample X.509 certificate (RSA 2048, self-signed test cert) used by the
// "Sample" button. Short enough to stay embedded; contains basic extensions.
const SAMPLE_CERT_PEM = `-----BEGIN CERTIFICATE-----
MIIDazCCAlOgAwIBAgIUJeohtgk8nnt8ofratXJg7kUJsI4wDQYJKoZIhvcNAQEL
BQAwRTELMAkGA1UEBhMCQVUxEzARBgNVBAgMClNvbWUtU3RhdGUxITAfBgNVBAoM
GEludGVybmV0IFdpZGdpdHMgUHR5IEx0ZDAeFw0yNDAxMDEwMDAwMDBaFw0zNDAx
MDEwMDAwMDBaMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEw
HwYDVQQKDBhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQwggEiMA0GCSqGSIb3DQEB
AQUAA4IBDwAwggEKAoIBAQC7VJTUt9Us8cKjMzEfYyjiWA4R4/M2bS1GB4t7NXp9
8C1pN3uoJj4XXq9ygRmGvIvi8lO2kIfvm5kGXXhE0T7uT1VW5f3h0l9Lq1IVSxVH
lFWbXp6Kh0FqN4zZkrWuNqmz3cD0H8Im2GHrqD+mIDJrNPEK9oXJW0MrB5EyLqkb
bYnldp1lB/0VXlAOH4nqzV+nJLY8aXbzUWE3iLNSshyBXxw2TCZgrBqc1BNJFQ3D
vH8FkKnzKepVE4l4dyiHBfAhxOcxlTI9sUMKVrDYnSvNdxSdEHmiQbyTtDc4ZJc7
TdobSnZo+6cEeqcgknMBU3qZc88VrFyqw3zpp2LXpR+XAgMBAAGjUzBRMB0GA1Ud
DgQWBBRULw9TV2aG/p8Bhp7fuBDbjeA3TDAfBgNVHSMEGDAWgBRULw9TV2aG/p8B
hp7fuBDbjeA3TDAPBgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IBAQCs
EY9y6owjEwNkNAWpWnhfFe3K2NDyETx0w/IURbCHjMsi/5l6t2GBx5vWs8PBgD9k
mRmDUu5dmH0BQCx8jG3CmbqycG0R2mCkVxvQp4O8m/VYwa8Q0F7PnlLTgCq3J2yT
QrqItC6k7JnOoiiM0FqDzkTyyrOQGp6xWdRUmltTVMLMzPl2hPmvlpHmNZ/nmJ3O
H0m/hXihe8PdN7Zlr4XJypzfkopYmkk8Cf7gkMFcYbcx9/gnW9oHP0qXfdrpk3MG
qIJLn9VnGvgnRy5AY+qVw1ObE1rJH0FVKm0C6CpjjpN0nGnkz7Qwxa+mrkZJ1n3U
oSScRdRsY0rM17ZsB17z
-----END CERTIFICATE-----`;

@Component({
  selector: 'app-asn1-viewer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    ToastModule,
    TreeModule,
    InputTextModule,
    TextareaModule,
    AutoCompleteModule,
    TagModule,
    PageHeaderComponent,
    IconsModule,
    AnchorHeadingDirective,
  ],
  providers: [MessageService],
  templateUrl: './asn1-viewer.component.html',
  styleUrl: './asn1-viewer.component.scss',
})
export class Asn1ViewerComponent implements OnInit, OnDestroy {
  @HostBinding('class') class = 'dt-page';

  // Raw text pasted by the user (PEM / Base64 / Hex; auto-detected).
  inputText: string = '';

  // One logical "document" may contain multiple PEM blocks (e.g. cert + key).
  decoded: DecodedBlock[] = [];

  // Currently-displayed error message, if any.
  errorMessage: string = '';

  // Name of the last uploaded file (for the UI). Plain text shown next to input.
  lastFileName: string = '';

  isBrowser: boolean = false;

  // Dynamically-loaded modules. Stored as `any` because SSR build must not pull
  // them in statically (they rely on browser-only globals in some code paths).
  private asn1js: any = null;
  private pkijs: any = null;

  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private messageService: MessageService,
    private pageTitleService: PageTitleService,
    private seoService: SeoService,
    private cdr: ChangeDetectorRef,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  async ngOnInit(): Promise<void> {
    this.pageTitleService.setTitle('ASN.1 Viewer & X.509 / PKCS Decoder');
    this.setupSeo();

    if (this.isBrowser) {
      // Dynamic import keeps asn1js/pkijs out of the SSR bundle.
      this.asn1js = await import('asn1js');
      this.pkijs = await import('pkijs');
    }
  }

  ngOnDestroy(): void {
    this.seoService.destroy();
  }

  // --------------------------------------------------------------------------
  // User-facing actions
  // --------------------------------------------------------------------------

  onInputChange(): void {
    this.parseCurrentInput();
  }

  loadSample(): void {
    this.inputText = SAMPLE_CERT_PEM;
    this.lastFileName = '';
    this.parseCurrentInput();
  }

  clearInput(): void {
    this.inputText = '';
    this.lastFileName = '';
    this.decoded = [];
    this.errorMessage = '';
  }

  async pasteFromClipboard(): Promise<void> {
    if (!this.isBrowser) return;
    try {
      const text = await navigator.clipboard.readText();
      this.inputText = text;
      this.lastFileName = '';
      this.parseCurrentInput();
      this.messageService.add({
        severity: 'success',
        summary: 'Pasted',
        detail: 'Content pasted from clipboard',
        life: 2500,
      });
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to read from clipboard',
        life: 3000,
      });
    } finally {
      // Zoneless app: explicit markForCheck after async work.
      this.cdr.markForCheck();
    }
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    this.onFileUpload({ files: [file] });
  }

  onFileUpload(event: { files: File[] }): void {
    const file: File | undefined = event?.files?.[0];
    if (!file) return;
    this.lastFileName = file.name;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        // Text PEM file or base64/hex in text form.
        this.inputText = result;
        this.parseCurrentInput();
      } else if (result instanceof ArrayBuffer) {
        // Binary DER/CER/PKCS7/... file — parse directly without touching the
        // text input so we preserve whatever the user typed before.
        this.inputText = '';
        this.parseBinaryBuffers([{ label: '', buffer: result }]);
      }
      this.clearFileInput();
      // App runs in zoneless mode — FileReader callbacks are outside Angular's
      // auto change detection, so the textarea ngModel won't refresh unless we
      // explicitly mark the view.
      this.cdr.markForCheck();
    };
    reader.onerror = () => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to read the file',
        life: 3000,
      });
      this.clearFileInput();
      this.cdr.markForCheck();
    };

    // Detect by extension: PEM-like are text, everything else treat as binary.
    const pemExtensions = ['.pem', '.crt', '.cer', '.csr', '.txt', '.asc'];
    const lower = file.name.toLowerCase();
    const isText = pemExtensions.some((ext) => lower.endsWith(ext));
    if (isText) reader.readAsText(file);
    else reader.readAsArrayBuffer(file);
  }

  private clearFileInput(): void {
    try {
      const el = this.fileInputRef?.nativeElement;
      if (el) el.value = '';
    } catch {
      // ignore
    }
  }

  copyToClipboard(text: string, kind: string): void {
    if (!this.isBrowser || !text) return;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Copied',
          detail: `${kind} copied to clipboard`,
          life: 2500,
        });
      })
      .catch(() => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to copy',
          life: 3000,
        });
      });
  }

  copyTreeAsJson(block: DecodedBlock): void {
    const json = JSON.stringify(this.treeToPlain(block.tree), null, 2);
    this.copyToClipboard(json, 'ASN.1 tree');
  }

  /**
   * Called by p-tree when the user expands a node. Builds the child nodes on
   * demand from the asn1 reference stashed in `node.data`. This keeps the
   * initial render cheap even for big PKCS#7 / CMS blobs.
   */
  onTreeNodeExpand(event: { node: TreeNode }): void {
    this.materialiseNode(event?.node);
  }

  private materialiseNode(node: TreeNode | undefined): void {
    if (!node || !node.data || node.data._built) return;
    node.data._built = true;

    const asn1: any = node.data._asn1;
    const baseOffset: number = node.data._childOffset ?? 0;

    if (asn1 && Array.isArray(asn1?.valueBlock?.value) && asn1.valueBlock.value.length) {
      const children: any[] = asn1.valueBlock.value;
      let childOffset = baseOffset;
      node.children = [];
      for (const child of children) {
        node.children.push(this.buildNode(child, childOffset));
        childOffset += child?.blockLength ?? 0;
      }
    } else if (node.data._maybeEmbedded) {
      const bytes: Uint8Array | undefined = asn1?.valueBlock?.valueHexView;
      const embedded = this.tryDecodeEmbedded(bytes);
      if (embedded) {
        node.children = [this.buildNode(embedded, 0, 'embedded')];
      } else {
        // No embedded ASN.1 after all — flip the node to a true leaf so p-tree
        // stops showing a "load more" chevron after the first failed expand.
        node.children = [];
        node.leaf = true;
      }
    }

    // Release the asn1 reference to free memory once materialised.
    node.data._asn1 = undefined;
  }

  private treeToPlain(nodes: TreeNode[]): any[] {
    return nodes.map((n) => ({
      label: n.label,
      ...(n.data ? { details: n.data } : {}),
      ...(n.children && n.children.length
        ? { children: this.treeToPlain(n.children) }
        : {}),
    }));
  }

  // --------------------------------------------------------------------------
  // Input detection & decoding
  // --------------------------------------------------------------------------

  private parseCurrentInput(): void {
    this.errorMessage = '';
    this.decoded = [];

    if (!this.isBrowser || !this.asn1js) return;

    const raw = this.inputText?.trim();
    if (!raw) return;

    const blocks = this.detectAndDecode(raw);
    if (!blocks.length) return;

    this.parseBinaryBuffers(blocks);
  }

  private parseBinaryBuffers(blocks: { label: string; buffer: ArrayBuffer }[]): void {
    const results: DecodedBlock[] = [];
    for (const block of blocks) {
      try {
        const parsed = this.parseBuffer(block.buffer, block.label);
        results.push(parsed);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        this.errorMessage = `Failed to parse ASN.1 data: ${msg}`;
        this.messageService.add({
          severity: 'error',
          summary: 'Parse error',
          detail: msg,
          life: 4000,
        });
      }
    }
    this.decoded = results;
  }

  /**
   * Accepts arbitrary user text, returns one or more decoded binary buffers.
   * Supports:
   *   - One or more PEM blocks (-----BEGIN ... -----)
   *   - Raw Base64 (with or without whitespace)
   *   - Hex string (with/without spaces, colons, 0x prefix)
   */
  private detectAndDecode(input: string): { label: string; buffer: ArrayBuffer }[] {
    const pemMatches = [
      ...input.matchAll(
        /-----BEGIN ([A-Z0-9 ]+)-----([\s\S]+?)-----END \1-----/g,
      ),
    ];
    if (pemMatches.length) {
      const blocks: { label: string; buffer: ArrayBuffer }[] = [];
      for (const match of pemMatches) {
        const label = match[1].trim();
        const body = match[2].replace(/[^A-Za-z0-9+/=]/g, '');
        try {
          blocks.push({ label, buffer: this.base64ToBuffer(body) });
        } catch (e) {
          this.errorMessage = `Invalid Base64 inside PEM block "${label}"`;
        }
      }
      return blocks;
    }

    // Hex first — strict check avoids accidentally matching pure ASCII letters.
    const hexCleaned = input.replace(/0x/gi, '').replace(/[\s:]/g, '');
    if (hexCleaned.length > 0 && /^[0-9a-fA-F]+$/.test(hexCleaned)) {
      if (hexCleaned.length % 2 !== 0) {
        this.errorMessage = 'Hex input length is odd — expected an even number of hex characters.';
        return [];
      }
      return [{ label: '', buffer: this.hexToBuffer(hexCleaned) }];
    }

    // Fallback: Base64 (strip everything that's not a Base64 character).
    const b64 = input.replace(/[^A-Za-z0-9+/=]/g, '');
    if (b64.length > 0 && b64.length % 4 === 0) {
      try {
        return [{ label: '', buffer: this.base64ToBuffer(b64) }];
      } catch {
        // fall through
      }
    }

    this.errorMessage =
      'Unable to detect input format. Paste a PEM block, a Base64 string, or a Hex string, or upload a DER/CER file.';
    return [];
  }

  private base64ToBuffer(b64: string): ArrayBuffer {
    const binary = atob(b64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }

  private hexToBuffer(hex: string): ArrayBuffer {
    const len = hex.length / 2;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes.buffer;
  }

  // --------------------------------------------------------------------------
  // Core parsing
  // --------------------------------------------------------------------------

  private parseBuffer(buffer: ArrayBuffer, pemLabel: string): DecodedBlock {
    const asn1 = this.asn1js.fromBER(buffer);
    if (asn1.offset === -1) {
      throw new Error(asn1.result?.error || 'Invalid ASN.1 structure');
    }

    // Decide detected type: PEM label first, else try pkijs parsers in order.
    const label = pemLabel.toUpperCase();
    let detectedType = PEM_LABEL_TO_TYPE[label] || '';
    let highLevelObject: any = null;

    const tryParse = (ctor: any, type: string): boolean => {
      try {
        highLevelObject = ctor.fromBER(buffer);
        detectedType = type;
        return true;
      } catch {
        return false;
      }
    };

    if (detectedType) {
      // Use the declared PEM label, but still build the high-level object when
      // possible so we can produce the rich summary.
      this.buildHighLevelFromType(detectedType, buffer, (obj) => (highLevelObject = obj));
    } else {
      const {
        Certificate,
        CertificationRequest,
        PrivateKeyInfo,
        PublicKeyInfo,
        ContentInfo,
        CertificateRevocationList,
      } = this.pkijs;

      // Try the most common/specific parsers first.
      tryParse(Certificate, 'Certificate') ||
        tryParse(CertificationRequest, 'CertificationRequest') ||
        tryParse(ContentInfo, 'ContentInfo') ||
        tryParse(PrivateKeyInfo, 'PrivateKeyInfo') ||
        tryParse(PublicKeyInfo, 'PublicKeyInfo') ||
        tryParse(CertificateRevocationList, 'CertificateRevocationList');
    }

    const summary = this.buildSummary(detectedType, highLevelObject, asn1.result);
    const rootNode = this.buildNode(asn1.result, 0);
    // Eagerly materialise the root and auto-expand it + its direct children so
    // users immediately see structure without having to click through empty
    // placeholder nodes.
    this.materialiseNode(rootNode);
    rootNode.expanded = true;
    for (const c of rootNode.children ?? []) {
      this.materialiseNode(c);
      c.expanded = true;
    }
    const tree = [rootNode];

    return {
      label: pemLabel || this.humanLabelForType(detectedType) || 'Binary data',
      detectedType: detectedType || 'Generic ASN.1',
      summary,
      summaryGroups: this.groupSummarySections(summary),
      tree,
      byteLength: buffer.byteLength,
      searchIndex: this.buildSearchIndex(asn1.result),
      searchSuggestions: [],
      searchModel: null,
    };
  }

  // --------------------------------------------------------------------------
  // ASN.1 node search (jump-to-offset autocomplete)
  // --------------------------------------------------------------------------

  /**
   * Walk the parsed asn1js tree once and collect a flat index of every node
   * (offset + length + display label + path). Used by the p-autoComplete to
   * jump straight to a node without materialising the whole TreeNode hierarchy.
   */
  private buildSearchIndex(root: any): SearchSuggestion[] {
    const out: SearchSuggestion[] = [];
    const walk = (node: any, offset: number, path: number[]): void => {
      if (!node) return;
      const tagClass: number = node?.idBlock?.tagClass ?? 1;
      const tagNumber: number = node?.idBlock?.tagNumber ?? 0;
      const blockLength: number = node?.blockLength ?? 0;
      const baseName = this.blockName(node);
      const preview = this.valuePreview(node, tagClass, tagNumber);
      const pretty = preview ? `${baseName}  ${preview}` : baseName;
      out.push({
        offset,
        length: blockLength,
        label: `@${offset} (${blockLength}B) — ${this.ellipsize(pretty, 80)}`,
        path: [...path],
      });

      const children: any[] = node?.valueBlock?.value ?? [];
      if (!Array.isArray(children) || !children.length) return;
      let headerBytes = blockLength;
      for (const c of children) headerBytes -= c?.blockLength ?? 0;
      let childOffset = offset + (headerBytes > 0 ? headerBytes : 0);
      children.forEach((child, i) => {
        walk(child, childOffset, [...path, i]);
        childOffset += child?.blockLength ?? 0;
      });
    };
    walk(root, 0, []);
    return out;
  }

  /**
   * p-autoComplete completeMethod handler. Filters the pre-built search index
   * by either numeric offset (prefix / contains) or substring in label.
   */
  onTreeSearch(block: DecodedBlock, event: { query: string }): void {
    const query = (event?.query ?? '').trim();
    if (!query) {
      block.searchSuggestions = block.searchIndex.slice(0, 50);
      return;
    }
    const lower = query.toLowerCase();
    const asNumber = /^\d+$/.test(query) ? Number(query) : null;

    const scored: { s: SearchSuggestion; score: number }[] = [];
    for (const s of block.searchIndex) {
      let score = -1;
      if (asNumber !== null) {
        if (s.offset === asNumber) score = 100;
        else if (String(s.offset).startsWith(query)) score = 80;
        else if (String(s.offset).includes(query)) score = 60;
      }
      if (score < 0 && s.label.toLowerCase().includes(lower)) score = 40;
      if (score >= 0) scored.push({ s, score });
    }
    scored.sort((a, b) => b.score - a.score || a.s.offset - b.s.offset);
    block.searchSuggestions = scored.slice(0, 50).map((x) => x.s);
  }

  /**
   * Called when the user picks a suggestion. Expands ancestors along the path,
   * highlights the target node and scrolls it into view.
   *
   * IMPORTANT: p-tree's inner UITreeNode uses `ChangeDetectionStrategy.OnPush`,
   * so mutating `node.expanded = true` in-place does NOT cause the affected
   * subtree to re-render — OnPush only reacts to new `@Input()` references.
   * To force re-render along the path we clone every TreeNode we touch
   * (root + each ancestor + the target) and replace them in their parent's
   * `children` array. Siblings on other branches keep their original
   * references, so the rest of the tree is not re-rendered.
   */
  onTreeSearchSelect(
    block: DecodedBlock,
    event: { value: SearchSuggestion } | SearchSuggestion,
  ): void {
    const sug: SearchSuggestion =
      (event as { value: SearchSuggestion })?.value ??
      (event as SearchSuggestion);
    if (!sug || !Array.isArray(sug.path)) return;

    for (const other of this.decoded) this.clearHighlights(other.tree);

    const target = this.navigateToPath(block, sug.path);
    if (!target) return;
    target.data = { ...(target.data ?? {}), _highlight: true };

    if (this.isBrowser) {
      setTimeout(() => {
        const el = document.querySelector(
          '.asn1-tree .asn1-node-highlight',
        ) as HTMLElement | null;
        el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 80);
    }
  }

  /**
   * Walks the path from the root down to the target node. Every node along
   * the path is materialised (children built on demand) and cloned so that
   * PrimeNG's OnPush UITreeNode sees a new `@Input` reference and
   * re-evaluates `node.expanded`. Replaces `block.tree` with the new root so
   * the top-level p-tree `[value]` binding also sees a new reference.
   */
  private navigateToPath(
    block: DecodedBlock,
    path: number[],
  ): TreeNode | null {
    const oldRoot = block.tree[0];
    if (!oldRoot) return null;

    this.materialiseNode(oldRoot);
    const newRoot = this.cloneTreeNode(oldRoot, /* expanded */ path.length > 0);
    let current = newRoot;

    for (let i = 0; i < path.length; i++) {
      const idx = path[i];
      this.materialiseNode(current);
      if (!current.children || idx >= current.children.length) return null;

      const oldChild = current.children[idx];
      this.materialiseNode(oldChild);
      // Ancestors along the path must be expanded so the target is visible;
      // the target itself (last step) is left collapsed so the user can
      // decide whether to dive deeper.
      const isLast = i === path.length - 1;
      const newChild = this.cloneTreeNode(oldChild, /* expanded */ !isLast);

      // `current.children` is already a fresh array from cloneTreeNode, so
      // mutating it in place here is safe.
      current.children[idx] = newChild;
      current = newChild;
    }

    block.tree = [newRoot];
    return current;
  }

  /**
   * Shallow-clone a TreeNode with a fresh `data` object and a fresh
   * `children` array (when present). Used by {@link navigateToPath} to
   * create new references along the expansion path so OnPush CD fires.
   */
  private cloneTreeNode(node: TreeNode, expanded: boolean): TreeNode {
    return {
      ...node,
      expanded,
      data: node.data ? { ...node.data } : node.data,
      children: Array.isArray(node.children) ? [...node.children] : node.children,
    };
  }

  private clearHighlights(nodes: TreeNode[] | undefined): void {
    if (!nodes) return;
    for (const n of nodes) {
      if (n.data && n.data._highlight) n.data._highlight = false;
      if (n.children?.length) this.clearHighlights(n.children);
    }
  }

  /**
   * Bundle consecutive sections that share the same `group` key into a single
   * SummaryGroup with a visible heading. Sections without a group become
   * single-element groups with no heading.
   */
  private groupSummarySections(sections: SummarySection[]): SummaryGroup[] {
    const groups: SummaryGroup[] = [];
    for (const section of sections) {
      if (section.group) {
        const last = groups[groups.length - 1];
        if (last && last.title === section.group) {
          last.sections.push(section);
          continue;
        }
        groups.push({ title: section.group, sections: [section] });
      } else {
        groups.push({ sections: [section] });
      }
    }
    return groups;
  }

  private buildHighLevelFromType(
    type: string,
    buffer: ArrayBuffer,
    setter: (obj: any) => void,
  ): void {
    const {
      Certificate,
      CertificationRequest,
      PrivateKeyInfo,
      PublicKeyInfo,
      ContentInfo,
      CertificateRevocationList,
      RSAPrivateKey,
      RSAPublicKey,
      ECPrivateKey,
    } = this.pkijs;
    try {
      switch (type) {
        case 'Certificate':
          setter(Certificate.fromBER(buffer));
          return;
        case 'CertificationRequest':
          setter(CertificationRequest.fromBER(buffer));
          return;
        case 'PrivateKeyInfo':
          setter(PrivateKeyInfo.fromBER(buffer));
          return;
        case 'PublicKeyInfo':
          setter(PublicKeyInfo.fromBER(buffer));
          return;
        case 'ContentInfo':
          setter(ContentInfo.fromBER(buffer));
          return;
        case 'CertificateRevocationList':
          setter(CertificateRevocationList.fromBER(buffer));
          return;
        case 'RSAPrivateKey':
          setter(RSAPrivateKey.fromBER(buffer));
          return;
        case 'RSAPublicKey':
          setter(RSAPublicKey.fromBER(buffer));
          return;
        case 'ECPrivateKey':
          setter(ECPrivateKey.fromBER(buffer));
          return;
      }
    } catch {
      // Leave high-level object as null — summary will fall back to ASN.1 tree.
    }
  }

  private humanLabelForType(type: string): string {
    switch (type) {
      case 'Certificate':
        return 'X.509 Certificate';
      case 'CertificationRequest':
        return 'Certificate Signing Request (PKCS#10)';
      case 'PrivateKeyInfo':
        return 'Private Key (PKCS#8)';
      case 'EncryptedPrivateKey':
        return 'Encrypted Private Key (PKCS#8)';
      case 'PublicKeyInfo':
        return 'Public Key (SPKI)';
      case 'RSAPrivateKey':
        return 'RSA Private Key (PKCS#1)';
      case 'RSAPublicKey':
        return 'RSA Public Key (PKCS#1)';
      case 'ECPrivateKey':
        return 'EC Private Key (SEC1)';
      case 'ContentInfo':
        return 'PKCS#7 / CMS ContentInfo';
      case 'CertificateRevocationList':
        return 'X.509 Certificate Revocation List';
      default:
        return '';
    }
  }

  // --------------------------------------------------------------------------
  // Summary construction (high-level interpretation)
  // --------------------------------------------------------------------------

  private buildSummary(
    detectedType: string,
    obj: any,
    rootAsn1: any,
  ): SummarySection[] {
    if (!obj) {
      return [this.genericSummary(rootAsn1)];
    }
    try {
      switch (detectedType) {
        case 'Certificate':
          return this.summarizeCertificate(obj);
        case 'CertificationRequest':
          return this.summarizeCsr(obj);
        case 'PrivateKeyInfo':
          return this.summarizePrivateKeyInfo(obj);
        case 'PublicKeyInfo':
          return this.summarizePublicKeyInfo(obj);
        case 'ContentInfo':
          return this.summarizeContentInfo(obj);
        case 'CertificateRevocationList':
          return this.summarizeCrl(obj);
        case 'RSAPrivateKey':
        case 'RSAPublicKey':
        case 'ECPrivateKey':
          return this.summarizeRawKey(detectedType, obj);
        default:
          return [this.genericSummary(rootAsn1)];
      }
    } catch {
      return [this.genericSummary(rootAsn1)];
    }
  }

  private genericSummary(root: any): SummarySection {
    const rows: SummaryRow[] = [
      { label: 'Top-level tag', value: this.blockName(root) },
      { label: 'Total length', value: `${root?.blockLength ?? 0} bytes` },
    ];
    return { title: 'Generic ASN.1', rows };
  }

  private summarizeCertificate(cert: any): SummarySection[] {
    const sections: SummarySection[] = [];

    sections.push({
      title: 'Certificate',
      rows: [
        { label: 'Version', value: `v${(cert.version ?? 0) + 1}` },
        {
          label: 'Serial Number',
          value: this.bufferToHex(cert.serialNumber?.valueBlock?.valueHexView),
          mono: true,
        },
        {
          label: 'Signature Algorithm',
          value: resolveOid(cert.signatureAlgorithm?.algorithmId),
        },
      ],
    });

    sections.push({
      title: 'Issuer',
      rows: this.rdnToRows(cert.issuer),
    });

    sections.push({
      title: 'Validity',
      rows: [
        { label: 'Not Before', value: this.dateToString(cert.notBefore?.value) },
        { label: 'Not After', value: this.dateToString(cert.notAfter?.value) },
      ],
    });

    sections.push({
      title: 'Subject',
      rows: this.rdnToRows(cert.subject),
    });

    sections.push({
      title: 'Subject Public Key Info',
      rows: this.publicKeyInfoRows(cert.subjectPublicKeyInfo),
    });

    if (cert.extensions?.length) {
      sections.push({
        title: `Extensions (${cert.extensions.length})`,
        rows: this.extensionsToRows(cert.extensions),
      });
    }

    return sections;
  }

  private summarizeCsr(csr: any): SummarySection[] {
    const sections: SummarySection[] = [];
    sections.push({
      title: 'Certification Request',
      rows: [
        { label: 'Version', value: String(csr.version ?? 0) },
        {
          label: 'Signature Algorithm',
          value: resolveOid(csr.signatureAlgorithm?.algorithmId),
        },
      ],
    });
    sections.push({ title: 'Subject', rows: this.rdnToRows(csr.subject) });
    sections.push({
      title: 'Subject Public Key Info',
      rows: this.publicKeyInfoRows(csr.subjectPublicKeyInfo),
    });
    if (csr.attributes?.length) {
      sections.push({
        title: `Attributes (${csr.attributes.length})`,
        rows: csr.attributes.map((a: any, idx: number) => ({
          label: `#${idx + 1}`,
          value: resolveOid(a.type),
        })),
      });
    }
    return sections;
  }

  private summarizePrivateKeyInfo(pki: any): SummarySection[] {
    const algo = pki.privateKeyAlgorithm;
    return [
      {
        title: 'Private Key (PKCS#8)',
        rows: [
          { label: 'Version', value: String(pki.version ?? 0) },
          { label: 'Algorithm', value: resolveOid(algo?.algorithmId) },
          ...this.algorithmParamRows(algo),
          {
            label: 'Encoded key length',
            value: `${pki.privateKey?.valueBlock?.valueHexView?.byteLength ?? 0} bytes`,
          },
        ],
      },
    ];
  }

  private summarizePublicKeyInfo(spki: any): SummarySection[] {
    return [
      {
        title: 'Public Key (SPKI)',
        rows: this.publicKeyInfoRows(spki),
      },
    ];
  }

  private publicKeyInfoRows(spki: any): SummaryRow[] {
    if (!spki) return [];
    const rows: SummaryRow[] = [
      { label: 'Algorithm', value: resolveOid(spki.algorithm?.algorithmId) },
      ...this.algorithmParamRows(spki.algorithm),
    ];

    // Try to guess the bit size from the raw key bytes.
    const keyBytes: Uint8Array | undefined =
      spki.subjectPublicKey?.valueBlock?.valueHexView;
    if (keyBytes) {
      rows.push({
        label: 'Public Key Bytes',
        value: `${keyBytes.byteLength} bytes`,
      });
    }

    // For RSA keys, try to inspect the modulus size.
    if (
      spki.algorithm?.algorithmId === '1.2.840.113549.1.1.1' &&
      keyBytes
    ) {
      try {
        const inner = this.asn1js.fromBER(keyBytes.buffer.slice(
          keyBytes.byteOffset,
          keyBytes.byteOffset + keyBytes.byteLength,
        ));
        if (inner?.offset !== -1) {
          const rsa = new this.pkijs.RSAPublicKey({ schema: inner.result });
          const modBits = this.bitSizeOfInteger(rsa.modulus);
          rows.push({ label: 'RSA Key Size', value: `${modBits} bits` });
        }
      } catch {
        // ignore
      }
    }

    return rows;
  }

  private algorithmParamRows(algo: any): SummaryRow[] {
    if (!algo?.algorithmParams) return [];
    try {
      // For ECC, the params are an OID for the named curve.
      const oid = algo.algorithmParams.valueBlock?.toString?.();
      if (oid && typeof oid === 'string' && /^\d+(\.\d+)+$/.test(oid)) {
        return [{ label: 'Named Curve', value: resolveOid(oid) }];
      }
    } catch {
      // ignore
    }
    return [];
  }

  private summarizeContentInfo(ci: any): SummarySection[] {
    const sections: SummarySection[] = [];
    sections.push({
      title: 'ContentInfo (PKCS#7 / CMS)',
      rows: [{ label: 'Content Type', value: resolveOid(ci.contentType) }],
    });

    if (ci.contentType === '1.2.840.113549.1.7.2' && this.pkijs?.SignedData) {
      try {
        const signed = new this.pkijs.SignedData({ schema: ci.content });
        const certs: any[] = signed.certificates ?? [];
        const signers: any[] = signed.signerInfos ?? [];

        const rows: SummaryRow[] = [
          { label: 'Version', value: String(signed.version ?? 0) },
          {
            label: 'Digest Algorithms',
            value: (signed.digestAlgorithms || [])
              .map((a: any) => oidShortName(a.algorithmId))
              .join(', '),
          },
          {
            label: 'Encapsulated Content Type',
            value: resolveOid(signed.encapContentInfo?.eContentType),
          },
          { label: 'Certificates', value: String(certs.length) },
          { label: 'CRLs', value: String((signed.crls || []).length) },
          { label: 'Signers', value: String(signers.length) },
        ];
        sections.push({ title: 'SignedData', rows });

        signers.forEach((signer: any, idx: number) => {
          sections.push(...this.summarizeSigner(signer, certs, idx));
        });
      } catch {
        // Leave the summary with just the ContentInfo row.
      }
    }

    return sections;
  }

  // --------------------------------------------------------------------------
  // SignedData: per-signer & related certificate extraction
  // --------------------------------------------------------------------------

  private summarizeSigner(
    signer: any,
    certs: any[],
    index: number,
  ): SummarySection[] {
    const group = `Signer #${index + 1}`;
    const out: SummarySection[] = [];
    const rows: SummaryRow[] = [
      { label: 'Version', value: String(signer.version ?? 0), noCopy: true },
      {
        label: 'Digest Algorithm',
        value: resolveOid(signer.digestAlgorithm?.algorithmId),
      },
      {
        label: 'Signature Algorithm',
        value: resolveOid(signer.signatureAlgorithm?.algorithmId),
      },
    ];

    // Well-known signed attributes (signing time, content type, message digest).
    const signedAttrs: any[] = signer.signedAttrs?.attributes ?? [];
    for (const attr of signedAttrs) {
      const oid = attr?.type;
      const val = attr?.values?.[0];
      if (!oid || !val) continue;
      if (oid === '1.2.840.113549.1.9.5') {
        const d = typeof val.toDate === 'function' ? val.toDate() : undefined;
        if (d) rows.push({ label: 'Signing Time', value: this.dateToString(d) });
      } else if (oid === '1.2.840.113549.1.9.3') {
        const ctOid = val.valueBlock?.toString?.();
        if (typeof ctOid === 'string' && /^\d+(\.\d+)+$/.test(ctOid)) {
          rows.push({ label: 'Signed Content Type', value: resolveOid(ctOid) });
        }
      } else if (oid === '1.2.840.113549.1.9.4') {
        const bytes: Uint8Array | undefined = val.valueBlock?.valueHexView;
        if (bytes) {
          rows.push({
            label: 'Message Digest',
            value: this.bufferToHex(bytes, 32),
            mono: true,
          });
        }
      }
    }

    // SignerIdentifier: either IssuerAndSerialNumber or SubjectKeyIdentifier.
    const sid = signer.sid;
    let matchedCert: any = null;

    if (sid?.issuer && sid?.serialNumber) {
      rows.push({
        label: 'Signer Id',
        value: 'IssuerAndSerialNumber',
        noCopy: true,
      });
      rows.push({
        label: 'Signer Cert Issuer',
        value: this.rdnToString(sid.issuer),
      });
      rows.push({
        label: 'Signer Cert Serial',
        value: this.bufferToHex(sid.serialNumber.valueBlock?.valueHexView),
        mono: true,
      });
      matchedCert =
        certs.find(
          (c: any) =>
            this.isPkiCertificate(c) &&
            this.rdnEquals(c.issuer, sid.issuer) &&
            this.serialEquals(c.serialNumber, sid.serialNumber),
        ) ?? null;
    } else if (sid?.valueBlock?.valueHexView) {
      const ski: Uint8Array = sid.valueBlock.valueHexView;
      rows.push({
        label: 'Signer Id',
        value: 'SubjectKeyIdentifier',
        noCopy: true,
      });
      rows.push({
        label: 'Subject Key Identifier',
        value: this.bufferToHex(ski),
        mono: true,
      });
      matchedCert =
        certs.find(
          (c: any) => this.isPkiCertificate(c) && this.certSkiEquals(c, ski),
        ) ?? null;
    }

    out.push({ group, title: 'Info', rows });

    if (!matchedCert) {
      out.push({
        group,
        title: 'Signer Certificate',
        rows: [
          {
            label: 'Note',
            value:
              'Signer certificate is not embedded in the SignedData certificates bag.',
            noCopy: true,
          },
        ],
      });
      return out;
    }

    out.push({
      group,
      title: 'Subject (Signer)',
      rows: this.rdnToRows(matchedCert.subject),
    });
    out.push({
      group,
      title: 'Issuer (CA that issued the cert)',
      rows: this.rdnToRows(matchedCert.issuer),
    });
    out.push({
      group,
      title: 'Certificate Details',
      rows: [
        {
          label: 'Serial',
          value: this.bufferToHex(
            matchedCert.serialNumber?.valueBlock?.valueHexView,
          ),
          mono: true,
        },
        {
          label: 'Not Before',
          value: this.dateToString(matchedCert.notBefore?.value),
        },
        {
          label: 'Not After',
          value: this.dateToString(matchedCert.notAfter?.value),
        },
        {
          label: 'Signature Algorithm',
          value: resolveOid(matchedCert.signatureAlgorithm?.algorithmId),
        },
      ],
    });

    // Try to also locate the issuer (CA) certificate inside the same bag.
    const caCert = certs.find(
      (c: any) =>
        c !== matchedCert &&
        this.isPkiCertificate(c) &&
        this.rdnEquals(c.subject, matchedCert.issuer),
    );
    if (caCert) {
      out.push({
        group,
        title: 'CA Subject',
        rows: this.rdnToRows(caCert.subject),
      });
      out.push({
        group,
        title: 'CA Details',
        rows: [
          {
            label: 'Serial',
            value: this.bufferToHex(
              caCert.serialNumber?.valueBlock?.valueHexView,
            ),
            mono: true,
          },
          {
            label: 'Not Before',
            value: this.dateToString(caCert.notBefore?.value),
          },
          {
            label: 'Not After',
            value: this.dateToString(caCert.notAfter?.value),
          },
          {
            label: 'Issuer (of CA)',
            value: this.rdnToString(caCert.issuer),
          },
          {
            label: 'Self-signed',
            value: this.rdnEquals(caCert.subject, caCert.issuer)
              ? 'yes (root)'
              : 'no (intermediate)',
            noCopy: true,
          },
        ],
      });
    }

    return out;
  }

  private isPkiCertificate(c: any): boolean {
    // Only full X.509 Certificate objects expose these properties; attribute
    // certificates from the CertificateSet do not.
    return !!(c?.issuer?.typesAndValues && c?.subject?.typesAndValues);
  }

  private rdnToString(rdn: any): string {
    return this.rdnToRows(rdn)
      .map((r) => `${r.label}=${r.value}`)
      .join(', ');
  }

  private rdnEquals(a: any, b: any): boolean {
    if (!a || !b) return false;
    try {
      const ba = new Uint8Array(a.toSchema().toBER(false));
      const bb = new Uint8Array(b.toSchema().toBER(false));
      if (ba.byteLength !== bb.byteLength) return false;
      for (let i = 0; i < ba.byteLength; i++) {
        if (ba[i] !== bb[i]) return false;
      }
      return true;
    } catch {
      return this.rdnToString(a) === this.rdnToString(b);
    }
  }

  private serialEquals(a: any, b: any): boolean {
    const ha = this.bufferToHex(a?.valueBlock?.valueHexView);
    const hb = this.bufferToHex(b?.valueBlock?.valueHexView);
    return !!ha && ha === hb;
  }

  private certSkiEquals(cert: any, ski: Uint8Array): boolean {
    const exts: any[] = cert.extensions ?? [];
    const skiExt = exts.find((e) => e.extnID === '2.5.29.14');
    if (!skiExt) return false;
    try {
      const raw: Uint8Array | undefined = skiExt.extnValue?.valueBlock?.valueHexView;
      if (!raw) return false;
      const inner = this.asn1js.fromBER(
        raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength),
      );
      if (inner.offset === -1) return false;
      const bytes: Uint8Array | undefined = inner.result?.valueBlock?.valueHexView;
      if (!bytes || bytes.byteLength !== ski.byteLength) return false;
      for (let i = 0; i < bytes.byteLength; i++) {
        if (bytes[i] !== ski[i]) return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  private summarizeCrl(crl: any): SummarySection[] {
    return [
      {
        title: 'Certificate Revocation List',
        rows: [
          { label: 'Version', value: String((crl.version ?? 0) + 1) },
          {
            label: 'Signature Algorithm',
            value: resolveOid(crl.signatureAlgorithm?.algorithmId),
          },
          {
            label: 'This Update',
            value: this.dateToString(crl.thisUpdate?.value),
          },
          {
            label: 'Next Update',
            value: this.dateToString(crl.nextUpdate?.value),
          },
          {
            label: 'Revoked entries',
            value: String(crl.revokedCertificates?.length ?? 0),
          },
        ],
      },
      { title: 'Issuer', rows: this.rdnToRows(crl.issuer) },
    ];
  }

  private summarizeRawKey(type: string, obj: any): SummarySection[] {
    if (type === 'RSAPublicKey') {
      return [
        {
          title: 'RSA Public Key (PKCS#1)',
          rows: [
            {
              label: 'Modulus',
              value: `${this.bitSizeOfInteger(obj.modulus)} bits`,
            },
            {
              label: 'Public Exponent',
              value: this.integerToDecimal(obj.publicExponent),
            },
          ],
        },
      ];
    }
    if (type === 'RSAPrivateKey') {
      return [
        {
          title: 'RSA Private Key (PKCS#1)',
          rows: [
            { label: 'Version', value: String(obj.version ?? 0) },
            {
              label: 'Modulus',
              value: `${this.bitSizeOfInteger(obj.modulus)} bits`,
            },
            {
              label: 'Public Exponent',
              value: this.integerToDecimal(obj.publicExponent),
            },
          ],
        },
      ];
    }
    if (type === 'ECPrivateKey') {
      return [
        {
          title: 'EC Private Key (SEC1)',
          rows: [
            { label: 'Version', value: String(obj.version ?? 0) },
            {
              label: 'Named Curve',
              value: resolveOid(obj.namedCurve),
            },
          ],
        },
      ];
    }
    return [{ title: type, rows: [] }];
  }

  // --------------------------------------------------------------------------
  // RDN / extensions helpers
  // --------------------------------------------------------------------------

  private rdnToRows(rdn: any): SummaryRow[] {
    if (!rdn?.typesAndValues) return [];
    return rdn.typesAndValues.map((tv: any) => ({
      label: oidShortName(tv.type),
      value: this.readStringValue(tv.value) ?? '(binary)',
    }));
  }

  private extensionsToRows(exts: any[]): SummaryRow[] {
    return exts.map((ext: any) => ({
      label: oidShortName(ext.extnID) + (ext.critical ? ' (critical)' : ''),
      value: this.extensionValueSummary(ext),
    }));
  }

  private extensionValueSummary(ext: any): string {
    const raw: Uint8Array | undefined = ext.extnValue?.valueBlock?.valueHexView;
    if (!raw) return '';

    try {
      const inner = this.asn1js.fromBER(
        raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength),
      );
      if (inner.offset === -1) return this.bufferToHex(raw, 32);

      const { BasicConstraints, ExtKeyUsage, AltName, AuthorityKeyIdentifier } =
        this.pkijs;

      switch (ext.extnID) {
        case '2.5.29.19': {
          const bc = new BasicConstraints({ schema: inner.result });
          const parts: string[] = [];
          parts.push(`cA=${bc.cA ? 'true' : 'false'}`);
          if (bc.pathLenConstraint !== undefined) {
            const pl =
              typeof bc.pathLenConstraint === 'number'
                ? bc.pathLenConstraint
                : bc.pathLenConstraint?.valueBlock?.valueDec;
            if (pl !== undefined) parts.push(`pathLenConstraint=${pl}`);
          }
          return parts.join(', ');
        }
        case '2.5.29.15': {
          // KeyUsage BIT STRING
          if (inner.result?.valueBlock?.valueHexView) {
            return this.decodeKeyUsage(inner.result);
          }
          return this.bufferToHex(raw, 32);
        }
        case '2.5.29.37': {
          const eku = new ExtKeyUsage({ schema: inner.result });
          return eku.keyPurposes.map((p: string) => oidShortName(p)).join(', ');
        }
        case '2.5.29.17':
        case '2.5.29.18': {
          const alt = new AltName({ schema: inner.result });
          return alt.altNames
            .map((n: any) => this.generalNameToString(n))
            .filter(Boolean)
            .join(', ');
        }
        case '2.5.29.14': {
          // SubjectKeyIdentifier: extnValue wraps an OCTET STRING containing the hash.
          const bytes = inner.result?.valueBlock?.valueHexView;
          return bytes ? this.bufferToHex(bytes) : this.bufferToHex(raw, 32);
        }
        case '2.5.29.35': {
          const aki = new AuthorityKeyIdentifier({ schema: inner.result });
          const kid = aki.keyIdentifier?.valueBlock?.valueHexView;
          return kid ? `keyId=${this.bufferToHex(kid)}` : this.bufferToHex(raw, 32);
        }
      }
    } catch {
      // fall through
    }
    return this.bufferToHex(raw, 32);
  }

  private decodeKeyUsage(bitStringNode: any): string {
    const bytes: Uint8Array | undefined = bitStringNode?.valueBlock?.valueHexView;
    if (!bytes || bytes.length === 0) return '';
    const unusedBits = bytes[0] ?? 0;
    const flags: string[] = [];
    for (let byteIdx = 1; byteIdx < bytes.length; byteIdx++) {
      for (let bit = 0; bit < 8; bit++) {
        const bitPos = (byteIdx - 1) * 8 + bit;
        if (bitPos >= KEY_USAGE_BITS.length) break;
        const set = ((bytes[byteIdx] >> (7 - bit)) & 1) === 1;
        if (set) flags.push(KEY_USAGE_BITS[bitPos]);
      }
    }
    void unusedBits;
    return flags.join(', ');
  }

  private generalNameToString(n: any): string {
    switch (n.type) {
      case 1:
        return `email:${n.value}`;
      case 2:
        return `DNS:${n.value}`;
      case 4:
        return `DirName:${this.readRdnAsString(n.value)}`;
      case 6:
        return `URI:${n.value}`;
      case 7: {
        const bytes: Uint8Array | undefined = n.value?.valueBlock?.valueHexView;
        if (!bytes) return '';
        if (bytes.length === 4) {
          return `IP:${bytes[0]}.${bytes[1]}.${bytes[2]}.${bytes[3]}`;
        }
        return `IP:${this.bufferToHex(bytes)}`;
      }
      case 8:
        return `RID:${resolveOid(n.value)}`;
      default:
        return `[${n.type}]`;
    }
  }

  private readRdnAsString(rdn: any): string {
    try {
      return (rdn?.typesAndValues || [])
        .map(
          (tv: any) =>
            `${oidShortName(tv.type)}=${this.readStringValue(tv.value) ?? ''}`,
        )
        .join(', ');
    } catch {
      return '';
    }
  }

  // --------------------------------------------------------------------------
  // ASN.1 -> TreeNode conversion
  // --------------------------------------------------------------------------

  /**
   * Build a single tree node without recursing. Children are stored as an
   * ASN.1 reference on `node.data` and realised later via {@link materialiseNode}
   * when p-tree fires the `onNodeExpand` event. This is the key to keeping the
   * page responsive for large PKCS#7 / CMS structures.
   */
  private buildNode(node: any, offset: number, keyHint?: string): TreeNode {
    const tagClass = node?.idBlock?.tagClass ?? 1;
    const tagNumber = node?.idBlock?.tagNumber ?? 0;
    const isConstructed = node?.idBlock?.isConstructed === true;
    const blockLength = node?.blockLength ?? 0;

    let label = '';
    if (keyHint) label += `${keyHint}: `;
    label += this.blockName(node);

    const contentBytes: Uint8Array | undefined =
      node?.valueBlock?.valueHexView ?? node?.valueBlock?.valueBeforeDecodeView;

    const valuePreview = this.valuePreview(node, tagClass, tagNumber);
    if (valuePreview) {
      label += `  ${valuePreview}`;
    }

    const children: any[] = node?.valueBlock?.value ?? [];
    const hasRealChildren = Array.isArray(children) && children.length > 0;
    const maybeEmbedded =
      !hasRealChildren &&
      !isConstructed &&
      tagClass === 1 &&
      (tagNumber === 3 || tagNumber === 4) &&
      this.looksLikeEmbeddedAsn1(node?.valueBlock?.valueHexView);

    // Compute the offset of the first child lazily — only used on expand.
    let childOffset = offset;
    if (hasRealChildren) {
      let headerBytes = blockLength;
      for (const c of children) headerBytes -= c?.blockLength ?? 0;
      if (headerBytes > 0) childOffset = offset + headerBytes;
    }

    const treeNode: TreeNode = {
      label,
      data: {
        tagClass: this.tagClassName(tagClass),
        tagNumber,
        constructed: isConstructed,
        offset,
        length: blockLength,
        hex:
          contentBytes && contentBytes.byteLength <= 48
            ? this.bufferToHex(contentBytes)
            : undefined,
        _asn1: hasRealChildren || maybeEmbedded ? node : undefined,
        _childOffset: childOffset,
        _maybeEmbedded: maybeEmbedded,
        _built: false,
      },
      leaf: !hasRealChildren && !maybeEmbedded,
      expanded: false,
      children: hasRealChildren || maybeEmbedded ? [] : undefined,
    };

    return treeNode;
  }

  /**
   * Cheap sniff for an ASN.1 structure embedded inside an OCTET STRING or BIT
   * STRING: verify the first byte looks like a valid tag and the length field
   * matches the buffer size. This avoids running `fromBER` thousands of times
   * on random-looking payloads during tree construction.
   */
  private looksLikeEmbeddedAsn1(bytes: Uint8Array | undefined): boolean {
    if (!bytes || bytes.byteLength < 2) return false;
    // Constructed SEQUENCE (0x30), SET (0x31), or context-specific constructed
    // tags (0xA0-0xBF) are what's almost always embedded. Primitive embeddings
    // are rare enough to skip for performance reasons.
    const firstByte = bytes[0];
    const isSeqOrSet = firstByte === 0x30 || firstByte === 0x31;
    const isContextConstructed = (firstByte & 0xc0) === 0x80 && (firstByte & 0x20) === 0x20;
    if (!isSeqOrSet && !isContextConstructed) return false;

    // Validate the DER length field matches the payload size (short or long form).
    const lenByte = bytes[1];
    let declaredLen = 0;
    let headerLen = 2;
    if ((lenByte & 0x80) === 0) {
      declaredLen = lenByte;
    } else {
      const numLenBytes = lenByte & 0x7f;
      if (numLenBytes === 0 || numLenBytes > 4 || bytes.byteLength < 2 + numLenBytes) {
        return false;
      }
      for (let i = 0; i < numLenBytes; i++) {
        declaredLen = (declaredLen << 8) | bytes[2 + i];
      }
      headerLen = 2 + numLenBytes;
    }
    return declaredLen + headerLen === bytes.byteLength;
  }

  private tryDecodeEmbedded(bytes: Uint8Array | undefined): any {
    if (!bytes || !this.asn1js) return null;
    try {
      const inner = this.asn1js.fromBER(
        bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      );
      if (inner.offset === -1) return null;
      return inner.result;
    } catch {
      return null;
    }
  }

  private blockName(node: any): string {
    const tagClass = node?.idBlock?.tagClass ?? 1;
    const tagNumber = node?.idBlock?.tagNumber ?? 0;
    const isConstructed = node?.idBlock?.isConstructed === true;

    if (tagClass === 1) {
      const universalName = UNIVERSAL_TAG_NAMES[tagNumber];
      if (universalName) return universalName;
      return `UNIVERSAL [${tagNumber}]`;
    }
    const prefix =
      tagClass === 3
        ? `[${tagNumber}]`
        : tagClass === 2
        ? `[APPLICATION ${tagNumber}]`
        : `[PRIVATE ${tagNumber}]`;
    return isConstructed ? `${prefix} (constructed)` : prefix;
  }

  private tagClassName(tagClass: number): string {
    switch (tagClass) {
      case 1:
        return 'Universal';
      case 2:
        return 'Application';
      case 3:
        return 'Context-specific';
      case 4:
        return 'Private';
      default:
        return `Class ${tagClass}`;
    }
  }

  private valuePreview(node: any, tagClass: number, tagNumber: number): string {
    try {
      // Universal primitives
      if (tagClass === 1) {
        switch (tagNumber) {
          case 1: // BOOLEAN
            return `= ${node.valueBlock?.value ? 'TRUE' : 'FALSE'}`;
          case 2: // INTEGER
            return `= ${this.integerToDecimal(node)}`;
          case 6: // OID
            return `= ${resolveOid(node.valueBlock?.toString?.())}`;
          case 10: // ENUMERATED
            return `= ${this.integerToDecimal(node)}`;
          case 5: // NULL
            return '';
          case 12:
          case 18:
          case 19:
          case 20:
          case 22:
          case 26:
          case 27:
          case 28:
          case 30: {
            const s = this.readStringValue(node);
            if (!s) return '';
            return `= "${this.ellipsize(s, 80)}"`;
          }
          case 23:
          case 24: {
            const d = this.dateToString(node.toDate?.());
            return d ? `= ${d}` : '';
          }
          case 3: // BIT STRING
          case 4: // OCTET STRING
            if (node.valueBlock?.valueHexView) {
              return `(${node.valueBlock.valueHexView.byteLength} bytes)`;
            }
            return '';
        }
      }
      return '';
    } catch {
      return '';
    }
  }

  private readStringValue(node: any): string | undefined {
    if (!node) return undefined;
    try {
      if (typeof node.valueBlock?.value === 'string') {
        return node.valueBlock.value;
      }
      if (typeof node.toString === 'function') {
        const s = node.toString();
        if (typeof s === 'string' && !s.startsWith('[object')) return s;
      }
    } catch {
      return undefined;
    }
    return undefined;
  }

  private dateToString(d: any): string {
    if (!d) return '';
    try {
      if (d instanceof Date && !Number.isNaN(d.getTime())) {
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        const h = String(d.getUTCHours()).padStart(2, '0');
        const mi = String(d.getUTCMinutes()).padStart(2, '0');
        const s = String(d.getUTCSeconds()).padStart(2, '0');
        return `${y}-${m}-${day} ${h}:${mi}:${s} UTC`;
      }
      if (typeof d === 'string') return d;
    } catch {
      // ignore
    }
    return String(d);
  }

  private bufferToHex(bytes: Uint8Array | undefined, limit?: number): string {
    if (!bytes) return '';
    const len = Math.min(bytes.byteLength, limit ?? bytes.byteLength);
    let result = '';
    for (let i = 0; i < len; i++) {
      result += bytes[i].toString(16).padStart(2, '0');
    }
    result = result.toUpperCase();
    if (len < bytes.byteLength) result += `…(+${bytes.byteLength - len} bytes)`;
    return result;
  }

  private integerToDecimal(integerNode: any): string {
    if (!integerNode) return '';
    try {
      if (integerNode.valueBlock?.valueDec !== undefined) {
        return String(integerNode.valueBlock.valueDec);
      }
      const bytes: Uint8Array | undefined = integerNode.valueBlock?.valueHexView;
      if (bytes && bytes.byteLength <= 6) {
        let n = 0;
        for (let i = 0; i < bytes.byteLength; i++) n = n * 256 + bytes[i];
        return String(n);
      }
      if (bytes) {
        return `0x${this.bufferToHex(bytes)}`;
      }
    } catch {
      // ignore
    }
    return '';
  }

  private bitSizeOfInteger(integerNode: any): number {
    const bytes: Uint8Array | undefined = integerNode?.valueBlock?.valueHexView;
    if (!bytes || bytes.byteLength === 0) return 0;
    // Strip the leading sign byte if present.
    let i = 0;
    while (i < bytes.byteLength && bytes[i] === 0) i++;
    if (i === bytes.byteLength) return 0;
    const bits = (bytes.byteLength - i) * 8;
    // Trim leading zero bits in the high byte.
    let high = bytes[i];
    let trim = 0;
    while ((high & 0x80) === 0 && trim < 7) {
      high <<= 1;
      trim++;
    }
    return bits - trim;
  }

  private ellipsize(s: string, max: number): string {
    return s.length > max ? s.slice(0, max) + '…' : s;
  }

  // --------------------------------------------------------------------------
  // SEO
  // --------------------------------------------------------------------------

  private setupSeo(): void {
    const pageUrl = 'https://onlinewebdevtools.com/asn1-viewer';
    const shortDescription =
      'Decode ASN.1 (DER/BER), X.509 certificates, CSR and PKCS structures online. Free in-browser ASN.1 viewer — no upload, no signup, privacy-first.';

    const metaData: MetaData = {
      OgTitle: 'ASN.1 Viewer & X.509 / PKCS Decoder | DevTools',
      OgDescription: shortDescription,
      description: shortDescription,
      keywords: [
        'ASN.1 decoder',
        'ASN.1 viewer',
        'DER decoder',
        'BER decoder',
        'X.509 parser',
        'certificate decoder online',
        'CSR decoder',
        'PKCS7 viewer',
        'PKCS8 viewer',
        'CMS viewer',
        'SPKI decoder',
        'openssl asn1parse alternative',
        'PEM decoder',
      ],
      jsonLd: {
        name: 'ASN.1 Viewer & X.509 / PKCS Decoder | DevTools',
        description: shortDescription,
        url: pageUrl,
        featureList: [
          'Decode ASN.1 (DER/BER) into a navigable tag/length/value tree',
          'Parse X.509 certificates with subject, issuer, validity and extensions',
          'Decode CSR (PKCS#10) requests with subject and public key info',
          'Decode PKCS#8 private keys and SPKI public keys (RSA, EC, Ed25519)',
          'Decode PKCS#7 / CMS SignedData and EnvelopedData containers',
          'Support PEM, raw Base64, Hex and binary DER/CER file upload',
          'Resolve common OIDs for algorithms, RDN attributes and X.509 extensions',
          '100% client-side processing — nothing leaves your browser',
        ],
      },
      faq: [
        {
          question: 'What is ASN.1 and why do I need a viewer?',
          answer:
            'ASN.1 (Abstract Syntax Notation One) is the formal notation used to describe the structure of X.509 certificates, PKCS and CMS messages, LDAP, SNMP and many other cryptographic formats. An ASN.1 viewer decodes the binary DER/BER encoding into a readable tree of tags, lengths and values so you can inspect certificates, CSRs and keys without installing OpenSSL.',
        },
        {
          question: 'What is the difference between DER, BER and PEM?',
          answer:
            'BER (Basic Encoding Rules) is the generic binary encoding of ASN.1. DER (Distinguished Encoding Rules) is a strict subset of BER used for digital signatures and certificates because it produces a unique canonical encoding. PEM is a text format that wraps DER bytes in Base64 between "-----BEGIN ..." and "-----END ..." markers so they can be safely pasted into emails, configuration files or cURL commands.',
        },
        {
          question: 'Which formats does this ASN.1 viewer support?',
          answer:
            'Paste PEM blocks (one or many), raw Base64 strings, hexadecimal dumps with or without separators, or upload a binary .der/.cer/.crt/.csr/.p7b/.p8/.key file. The tool auto-detects the input format and renders both the raw ASN.1 tree and a high-level summary for certificates, CSRs, keys and PKCS#7 envelopes.',
        },
        {
          question: 'Is my data safe? Do you upload my certificate or private key?',
          answer:
            'All parsing runs entirely in your browser via JavaScript — nothing is uploaded. That said, private keys are credentials: avoid pasting production private keys into any third-party tool, including this one. For sensitive debugging, use a copy of the key on a workstation you trust and rotate it afterwards if you are unsure.',
        },
        {
          question: 'Can this tool replace openssl asn1parse, x509 -text or pkcs7 -print_certs?',
          answer:
            'For inspection workflows, yes — this viewer shows the ASN.1 tree like "openssl asn1parse" and the decoded certificate fields like "openssl x509 -text", but with a friendlier UI and OID resolution. It does not sign, issue or modify certificates; it is read-only.',
        },
        {
          question: 'Which X.509 extensions are decoded?',
          answer:
            'The summary table shows the common ones: BasicConstraints, KeyUsage, ExtendedKeyUsage, SubjectAltName, IssuerAltName, SubjectKeyIdentifier and AuthorityKeyIdentifier. All other extensions are still fully visible in the raw ASN.1 tree, with their OIDs resolved to human-readable names where possible.',
        },
        {
          question: 'What does "SEQUENCE", "SET" or "[0]" mean in the tree?',
          answer:
            'These are ASN.1 tags. SEQUENCE and SET are constructed Universal tags that group child elements. Values like [0], [1], [3] are context-specific tags used for optional or implicit fields (for example [3] wraps the extensions block inside a TBSCertificate). Primitive tags like INTEGER, OBJECT IDENTIFIER, UTF8String and BIT STRING carry leaf values.',
        },
        {
          question: 'Why does my certificate show notBefore/notAfter in UTC?',
          answer:
            'X.509 Validity timestamps are encoded as UTCTime or GeneralizedTime, both of which represent absolute UTC moments. The viewer displays them in ISO-8601 UTC form so they are unambiguous regardless of your local timezone.',
        },
      ],
      howTo: {
        name: 'How to decode an ASN.1 / X.509 structure online',
        description:
          'Decode a PEM, DER or hex-encoded ASN.1 structure (certificate, CSR, key, PKCS#7) directly in your browser.',
        totalTime: 'PT1M',
        steps: [
          {
            name: 'Paste or upload the data',
            text: 'Paste a PEM block, a raw Base64 string, or a hex dump into the input field; alternatively upload a binary DER/CER/CSR/P7B file. The tool auto-detects the format.',
            url: pageUrl + '#input',
          },
          {
            name: 'Review the detected type summary',
            text: 'Inspect the detected-type badge and the structured summary: certificate subject/issuer/validity/extensions, CSR subject and public key, or key algorithm and size.',
            url: pageUrl + '#summary',
          },
          {
            name: 'Explore the ASN.1 tree',
            text: 'Expand the ASN.1 tree to see every tag, length and value — with OIDs resolved to human-readable names, and embedded structures (such as extnValue octet strings) automatically re-decoded.',
            url: pageUrl + '#tree',
          },
        ],
      },
      breadcrumbs: [
        { name: 'Home', url: 'https://onlinewebdevtools.com/' },
        { name: 'ASN.1 Viewer', url: pageUrl },
      ],
    };

    this.seoService.setupSeo(metaData);
  }
}
