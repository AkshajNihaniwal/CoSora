import fs from 'fs/promises';
import { config } from '../config';

export interface VisualHint {
  type: 'chart' | 'pie_chart' | 'bar_graph' | 'line_graph' | 'table' | 'diagram' | 'graph';
  location: string;
  title: string;
  description: string;
  dataSummary?: string;
  legalRelevance?: string;
}

export interface ExtractedDocument {
  filename: string;
  mimeType: string;
  text: string;
  pageCount?: number;
  sheetCount?: number;
  extractionNote?: string;
  visualHints?: VisualHint[];
}

export async function extractTextFromBuffer(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<ExtractedDocument> {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  try {
    if (mimeType === 'text/plain' || ext === 'txt' || ext === 'md') {
      return { filename, mimeType, text: truncate(buffer.toString('utf-8')) };
    }

    if (mimeType === 'text/csv' || ext === 'csv') {
      return { filename, mimeType, text: truncate(buffer.toString('utf-8')) };
    }

    if (mimeType === 'application/pdf' || ext === 'pdf') {
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(buffer);
      const text = data.text || '';
      const visualHints: VisualHint[] = [];
      if (/\b(chart|graph|figure|exhibit|annexure|schedule)\b/i.test(text)) {
        visualHints.push({
          type: 'chart',
          location: 'PDF body',
          title: 'Referenced charts/graphs/figures',
          description: 'Document text references charts, graphs, figures, or annexures — verify embedded visuals in full PDF.',
        });
      }
      return {
        filename,
        mimeType,
        text: truncate(text),
        pageCount: data.numpages,
        visualHints: visualHints.length ? visualHints : undefined,
      };
    }

    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      ext === 'docx'
    ) {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      return {
        filename,
        mimeType,
        text: truncate(result.value || ''),
        extractionNote: result.messages?.length ? 'Partial extraction' : undefined,
      };
    }

    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimeType === 'application/vnd.ms-excel' ||
      ext === 'xlsx' ||
      ext === 'xls'
    ) {
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(buffer, { type: 'buffer', cellStyles: true });
      const parts: string[] = [];
      const visualHints: VisualHint[] = [];

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        parts.push(`[Sheet: ${sheetName}]\n${csv}`);

        const chartLikeName = /chart|graph|summary|dashboard|analysis|breakdown|distribution|trend|pie|bar/i.test(sheetName);
        const hasNumericGrid = (csv.match(/\d+[,.]?\d*/g) || []).length > 8;
        if (chartLikeName || hasNumericGrid) {
          visualHints.push({
            type: chartLikeName && /pie/i.test(sheetName) ? 'pie_chart' : chartLikeName && /bar/i.test(sheetName) ? 'bar_graph' : 'table',
            location: `Sheet: ${sheetName}`,
            title: `${sheetName} data table`,
            description: chartLikeName
              ? `Worksheet "${sheetName}" appears to contain chart/graph supporting data — review numeric breakdown.`
              : `Worksheet "${sheetName}" contains structured numeric data suitable for chart visualization.`,
            dataSummary: csv.split('\n').slice(0, 6).join(' | '),
          });
        }
      }

      const wbCharts = (workbook as { Charts?: unknown[] }).Charts;
      if (wbCharts && Array.isArray(wbCharts) && wbCharts.length > 0) {
        visualHints.push({
          type: 'chart',
          location: filename,
          title: 'Embedded Excel chart(s)',
          description: `${wbCharts.length} embedded chart object(s) detected in workbook — financial/regulatory visuals may be material to risk assessment.`,
        });
      }

      return {
        filename,
        mimeType,
        text: truncate(parts.join('\n\n')),
        sheetCount: workbook.SheetNames.length,
        visualHints: visualHints.length ? visualHints : undefined,
      };
    }

    if (ext === 'doc') {
      return {
        filename,
        mimeType,
        text: '',
        extractionNote: 'Legacy .doc format — please convert to .docx or PDF for full analysis',
      };
    }

    // Fallback: try UTF-8 read
    const asText = buffer.toString('utf-8');
    if (asText && /^[\x09\x0A\x0D\x20-\x7E\u00A0-\uFFFF]*$/.test(asText.slice(0, 500))) {
      return { filename, mimeType, text: truncate(asText) };
    }

    return {
      filename,
      mimeType,
      text: '',
      extractionNote: `Unsupported format: ${ext || mimeType}`,
    };
  } catch (err) {
    return {
      filename,
      mimeType,
      text: '',
      extractionNote: err instanceof Error ? err.message : 'Extraction failed',
    };
  }
}

export async function extractTextFromFile(filepath: string, filename: string, mimeType: string) {
  const buffer = await fs.readFile(filepath);
  return extractTextFromBuffer(buffer, filename, mimeType);
}

function truncate(text: string): string {
  const max = config.upload.maxExtractChars;
  const cleaned = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max)}\n\n[... truncated for analysis — full document stored ...]`;
}

export const ALLOWED_INTAKE_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt', '.md',
];

export const ALLOWED_INTAKE_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'application/octet-stream',
];
