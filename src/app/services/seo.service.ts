import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { DOCUMENT, isPlatformBrowser, isPlatformServer } from '@angular/common';

export interface JsonLdSchema {
    name: string;
    description: string;
    url: string;
}

export interface MetaData {
    OgTitle: string;
    OgDescription: string;
    description: string;
    keywords: string[];
    jsonLd: JsonLdSchema;
}

@Injectable({
    providedIn: 'root'
})
export class SeoService {
    private isBrowser: boolean = false;
    private isServer: boolean = false;
    private schemaScriptElement: HTMLElement | null = null;
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
        // Устанавливаем основные мета-теги
        this.metaService.updateTag({
            name: 'description',
            content: metaData.description
        });

        this.metaService.updateTag({
            name: 'keywords',
            content: metaData.keywords.join(', ')
        });

        // Open Graph мета-теги для лучшего отображения при шаринге в соцсетях
        this.metaService.updateTag({ property: 'og:title', content: metaData.OgTitle });
        this.metaService.updateTag({ property: 'og:description', content: metaData.OgDescription });
        this.metaService.updateTag({ property: 'og:type', content: 'website' });
        this.metaService.updateTag({ property: 'og:site_name', content: 'DevTools' });
        
        // Сначала удаляем старые элементы, чтобы избежать дублирования и ошибок
        this.clearExistingElements();
        
        // Затем добавляем новые элементы
        this.addJsonLdToHead(metaData.jsonLd);
        this.setCanonicalLink(metaData.jsonLd.url);
    }

    /**
     * Очищает все SEO элементы при уничтожении компонента
     */
    destroy() {
        this.clearExistingElements();
    }

    private addJsonLdToHead(data: JsonLdSchema) {
        console.log('addJsonLdToHead', data);
        // Не выполняем добавление, если не работаем в браузере или на сервере
        if (!this.isBrowser && !this.isServer) {
            return;
        }
        
        const schema = {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": data.name,
            "description": data.description,
            "applicationCategory": "Utilities",
            "operatingSystem": "All",
            "url": data.url
        };

        try {
            // Создаем новый элемент скрипта
            const scriptElement = this.document.createElement('script');
            scriptElement.setAttribute('type', 'application/ld+json');
            scriptElement.textContent = JSON.stringify(schema);
            
            // Добавляем в head
            this.document.head.appendChild(scriptElement);
            
            // Сохраняем ссылку для последующего удаления
            this.schemaScriptElement = scriptElement;
        } catch (e) {
            console.error('Error adding JSON-LD script:', e);
        }
    }
    
    /**
     * Устанавливает каноническую ссылку для страницы
     * @param url Полный URL страницы без параметров отслеживания
     */
    private setCanonicalLink(url: string) {
        // Не выполняем добавление, если не работаем в браузере или на сервере
        if (!this.isBrowser && !this.isServer) {
            return;
        }
        
        try {
            // Создаем новый элемент канонической ссылки
            const linkElement = this.document.createElement('link');
            linkElement.setAttribute('rel', 'canonical');
            linkElement.setAttribute('href', url);
            
            // Добавляем в head
            this.document.head.appendChild(linkElement);
            
            // Сохраняем ссылку для последующего удаления
            this.canonicalLinkElement = linkElement;
        } catch (e) {
            console.error('Error setting canonical link:', e);
        }
    }

    /**
     * Публичный метод для установки канонической ссылки
     * @param url Полный URL страницы без параметров отслеживания
     */
    public setCanonicalLinkPublic(url: string): void {
        // Сначала очищаем существующие элементы
        this.clearExistingElements();
        // Затем устанавливаем новую каноническую ссылку
        this.setCanonicalLink(url);
    }

    /**
     * Очищает существующие элементы JSON-LD и канонической ссылки
     */
    private clearExistingElements() {
        // Удаляем существующий JSON-LD скрипт
        if (this.schemaScriptElement) {
            try {
                if (this.schemaScriptElement.parentNode) {
                    this.schemaScriptElement.parentNode.removeChild(this.schemaScriptElement);
                }
                this.schemaScriptElement = null;
            } catch (e) {
                console.error('Error removing JSON-LD script:', e);
            }
        }
        else{
            this.schemaScriptElement = this.document.head.querySelector('script[type="application/ld+json"]');
            try {
                if (this.schemaScriptElement?.parentNode) {
                    this.schemaScriptElement.parentNode.removeChild(this.schemaScriptElement);
                }
                this.schemaScriptElement = null;
            } catch (e) {
                console.error('Error removing JSON-LD script:', e);
            }
        }
        
        // Удаляем существующую каноническую ссылку
        if (this.canonicalLinkElement) {
            try {
                if (this.canonicalLinkElement.parentNode) {
                    this.canonicalLinkElement.parentNode.removeChild(this.canonicalLinkElement);
                }
                this.canonicalLinkElement = null;
            } catch (e) {
                console.error('Error removing canonical link:', e);
            }
        }
        
        // Удаляем другие существующие канонические ссылки в документе
        const existingLink = this.document.querySelector('link[rel="canonical"]');
        if (existingLink && existingLink.parentNode) {
            try {
                existingLink.parentNode.removeChild(existingLink);
            } catch (e) {
                console.error('Error removing existing canonical link:', e);
            }
        }
    }
}