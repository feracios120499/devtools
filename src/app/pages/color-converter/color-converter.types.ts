export interface ColorFormat {
  name: string;
  value: string;
  display: string;
}

export interface ColorConverterSettings {
  selectedFormat: string;
  selectedColor: string;
  colorHistory?: ColorHistoryItem[];
  selectedHistoryColumns?: string[];
}

export interface ColorHistoryItem {
  id: string;
  color: string;
  format: string;
  timestamp: number;
  values: { [key: string]: string };
} 