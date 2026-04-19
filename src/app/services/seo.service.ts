import { Inject, Injectable, PLATFORM_ID, DOCUMENT } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';

export interface JsonLdSchema {
    name: string;
    description: string;
    url: string;
    featureList?: string[];
}

export interface FaqEntry {
    question: string;
    answer: string;
}

export interface HowToStep {
    name: string;
    text: string;
    url?: string;
}

export interface HowToSchema {
    name: string;
    description: string;
    steps: HowToStep[];
    totalTime?: string;
}

export interface BreadcrumbItem {
    name: string;
    url: string;
}

export interface MetaData {
    OgTitle: string;
    OgDescription: string;
    description: string;
    keywords: string[];
    jsonLd: JsonLdSchema;
    faq?: FaqEntry[];
    howTo?: HowToSchema;
    breadcrumbs?: BreadcrumbItem[];
    twitterImage?: string;
}

// Attribute used to tag dynamically-managed SEO elements in <head>
const SEO_DYNAMIC_ATTR = 'data-seo';
const SEO_DYNAMIC_VALUE = 'dynamic';

@Injectable({
    providedIn: 'root'
})
export class SeoService {
    private isBrowser: boolean = false;
    private isServer: boolean = false;
    private schemaScriptElements: HTMLElement[] = [];
    private canonicalLinkElement: HTMLElement | null = null;

    constructor(
        @Inject(PLATFORM_ID) private platformId: Object,
        @Inject(DOCUMENT) private document: Document,
        private metaService: Meta
    ) {
        this.isBrowser = isPlatformBrowser(this.platformId);
        this.isServer = isPlatformServer(this.platformId);
    }

    setupSeo(metaData: MetaData) {
        // Basic meta tags
        this.metaService.updateTag({
            name: 'description',
            content: metaData.description
        });

        this.metaService.updateTag({
            name: 'keywords',
            content: metaData.keywords.join(', ')
        });

        // Open Graph tags for social sharing
        this.metaService.updateTag({ property: 'og:title', content: metaData.OgTitle });
        this.metaService.updateTag({ property: 'og:description', content: metaData.OgDescription });
        this.metaService.updateTag({ property: 'og:type', content: 'website' });
        this.metaService.updateTag({ property: 'og:site_name', content: 'DevTools' });
        this.metaService.updateTag({ property: 'og:image', content: 'https://onlinewebdevtools.com/logo.png' });
        this.metaService.updateTag({ property: 'og:locale', content: 'en_US' });
        this.metaService.updateTag({ property: 'og:url', content: metaData.jsonLd.url });

        // Twitter Card tags
        const twitterImage = metaData.twitterImage ?? 'https://onlinewebdevtools.com/logo.png';
        this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
        this.metaService.updateTag({ name: 'twitter:title', content: metaData.OgTitle });
        this.metaService.updateTag({ name: 'twitter:description', content: metaData.OgDescription });
        this.metaService.updateTag({ name: 'twitter:image', content: twitterImage });

        // Remove previously-managed elements before adding new ones
        this.clearExistingElements();

        // Add structured data
        this.addJsonLdToHead(metaData.jsonLd);

        if (metaData.faq && metaData.faq.length > 0) {
            this.addFaqJsonLd(metaData.faq);
        }

        if (metaData.howTo) {
            this.addHowToJsonLd(metaData.howTo);
        }

        if (metaData.breadcrumbs && metaData.breadcrumbs.length > 0) {
            this.addBreadcrumbsJsonLd(metaData.breadcrumbs);
        }

        this.setCanonicalLink(metaData.jsonLd.url);
    }

    /**
     * Clears all managed SEO elements when the component is destroyed
     */
    destroy() {
        this.clearExistingElements();
    }

    private addJsonLdToHead(data: JsonLdSchema) {
        if (!this.isBrowser && !this.isServer) {
            return;
        }

        const schema: Record<string, unknown> = {
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: data.name,
            description: data.description,
            applicationCategory: 'Utilities',
            operatingSystem: 'All',
            url: data.url,
            inLanguage: 'en',
            isAccessibleForFree: true,
            browserRequirements: 'Requires JavaScript. Requires HTML5.',
            offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD'
            }
        };

        if (data.featureList && data.featureList.length > 0) {
            schema['featureList'] = data.featureList;
        }

        this.appendJsonLdScript(schema);
    }

    private addFaqJsonLd(faq: FaqEntry[]) {
        if (!this.isBrowser && !this.isServer) {
            return;
        }

        const schema = {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faq.map(entry => ({
                '@type': 'Question',
                name: entry.question,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: entry.answer
                }
            }))
        };

        this.appendJsonLdScript(schema);
    }

    private addHowToJsonLd(howTo: HowToSchema) {
        if (!this.isBrowser && !this.isServer) {
            return;
        }

        const schema: Record<string, unknown> = {
            '@context': 'https://schema.org',
            '@type': 'HowTo',
            name: howTo.name,
            description: howTo.description,
            step: howTo.steps.map((step, index) => {
                const stepSchema: Record<string, unknown> = {
                    '@type': 'HowToStep',
                    position: index + 1,
                    name: step.name,
                    text: step.text
                };
                if (step.url) {
                    stepSchema['url'] = step.url;
                }
                return stepSchema;
            })
        };

        if (howTo.totalTime) {
            schema['totalTime'] = howTo.totalTime;
        }

        this.appendJsonLdScript(schema);
    }

    private addBreadcrumbsJsonLd(items: BreadcrumbItem[]) {
        if (!this.isBrowser && !this.isServer) {
            return;
        }

        const schema = {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: items.map((item, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: item.name,
                item: item.url
            }))
        };

        this.appendJsonLdScript(schema);
    }

    /**
     * Creates a JSON-LD <script> tag and tracks it for later removal
     */
    private appendJsonLdScript(schema: Record<string, unknown>) {
        try {
            const scriptElement = this.document.createElement('script');
            scriptElement.setAttribute('type', 'application/ld+json');
            scriptElement.setAttribute(SEO_DYNAMIC_ATTR, SEO_DYNAMIC_VALUE);
            scriptElement.textContent = JSON.stringify(schema);

            this.document.head.appendChild(scriptElement);
            this.schemaScriptElements.push(scriptElement);
        } catch (e) {
            console.error('Error adding JSON-LD script:', e);
        }
    }

    /**
     * Sets the canonical link for the current page
     * @param url Full canonical URL without tracking params
     */
    private setCanonicalLink(url: string) {
        if (!this.isBrowser && !this.isServer) {
            return;
        }

        try {
            const linkElement = this.document.createElement('link');
            linkElement.setAttribute('rel', 'canonical');
            linkElement.setAttribute('href', url);
            linkElement.setAttribute(SEO_DYNAMIC_ATTR, SEO_DYNAMIC_VALUE);

            this.document.head.appendChild(linkElement);
            this.canonicalLinkElement = linkElement;
        } catch (e) {
            console.error('Error setting canonical link:', e);
        }
    }

    /**
     * Public setter for canonical link (kept for backward compatibility)
     */
    public setCanonicalLinkPublic(url: string): void {
        this.clearExistingElements();
        this.setCanonicalLink(url);
    }

    /**
     * Removes JSON-LD scripts and canonical link added by this service.
     * Only removes elements tagged with data-seo="dynamic" to avoid deleting
     * globally-defined SEO elements (e.g. placed in index.html).
     */
    private clearExistingElements() {
        // Remove tracked JSON-LD scripts
        for (const el of this.schemaScriptElements) {
            try {
                el.parentNode?.removeChild(el);
            } catch (e) {
                console.error('Error removing JSON-LD script:', e);
            }
        }
        this.schemaScriptElements = [];

        // Sweep any orphaned dynamic JSON-LD scripts (e.g. from previous SSR pass)
        const orphanScripts = this.document.head.querySelectorAll(
            `script[type="application/ld+json"][${SEO_DYNAMIC_ATTR}="${SEO_DYNAMIC_VALUE}"]`
        );
        orphanScripts.forEach(node => {
            try {
                node.parentNode?.removeChild(node);
            } catch (e) {
                console.error('Error removing orphan JSON-LD script:', e);
            }
        });

        // Remove tracked canonical link
        if (this.canonicalLinkElement) {
            try {
                this.canonicalLinkElement.parentNode?.removeChild(this.canonicalLinkElement);
            } catch (e) {
                console.error('Error removing canonical link:', e);
            }
            this.canonicalLinkElement = null;
        }

        // Sweep any orphaned dynamic canonical links
        const orphanCanonicals = this.document.head.querySelectorAll(
            `link[rel="canonical"][${SEO_DYNAMIC_ATTR}="${SEO_DYNAMIC_VALUE}"]`
        );
        orphanCanonicals.forEach(node => {
            try {
                node.parentNode?.removeChild(node);
            } catch (e) {
                console.error('Error removing orphan canonical link:', e);
            }
        });
    }
}
