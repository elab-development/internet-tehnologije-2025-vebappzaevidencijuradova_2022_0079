import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

const UPLOAD_BASE = path.join(process.cwd(), 'uploads');

// Supported file extensions for upload

// Podržani formati dokumenata
const SUPPORTED_EXTENSIONS = [
  '.txt',
  '.doc', '.docx',
  '.xls', '.xlsx',
  '.pdf',
  '.ppt', '.pptx'
];

/**
 * Sanitize filename to prevent path traversal attacks
 */
function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Generate random filename to prevent conflicts while preserving extension
 */
function generateRandomFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const randomString = crypto.randomBytes(16).toString('hex');
  return `${randomString}${ext}`;
}

/**
 * Check if file type is supported
 */
function isFileSupported(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(ext);
}

/**
 * Save uploaded file
 */
export async function saveUploadedFile(
  courseName: string,
  assignmentTitle: string,
  file: File
): Promise<string> {
  // Check if file type is supported
  if (!isFileSupported(file.name)) {
    throw new Error(
      `Nepodržan format fajla. Podržani formati su: ${SUPPORTED_EXTENSIONS.join(', ')}`
    );
  }

  // Sanitize folder names
  const sanitizedCourseName = sanitizeFilename(courseName);
  const sanitizedAssignmentTitle = sanitizeFilename(assignmentTitle);

  // Create directory structure
  const uploadDir = path.join(
    UPLOAD_BASE,
    sanitizedCourseName,
    sanitizedAssignmentTitle
  );

  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  // Generate random filename
  const randomFilename = generateRandomFilename(file.name);
  const filePath = path.join(uploadDir, randomFilename);

  // Convert file to buffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Save file
  await writeFile(filePath, buffer);

  // Return relative path
  return path.join(sanitizedCourseName, sanitizedAssignmentTitle, randomFilename);
}

/**
 * Save plagiarism report
 */
export async function savePlagiarismReport(
  courseName: string,
  assignmentTitle: string,
  originalFilename: string,
  report: string
): Promise<string> {
  // Sanitize names
  const sanitizedCourseName = sanitizeFilename(courseName);
  const sanitizedAssignmentTitle = sanitizeFilename(assignmentTitle);

  // Create directory
  const uploadDir = path.join(
    UPLOAD_BASE,
    sanitizedCourseName,
    sanitizedAssignmentTitle
  );

  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  // Generate report filename
  const reportFilename = `${path.parse(originalFilename).name}-report.txt`;
  const reportPath = path.join(uploadDir, reportFilename);

  // Save report
  await writeFile(reportPath, report, 'utf-8');

  // Return relative path
  return path.join(sanitizedCourseName, sanitizedAssignmentTitle, reportFilename);
}

/**
 * Get absolute path from relative path
 */
export function getAbsolutePath(relativePath: string): string {
  return path.join(UPLOAD_BASE, relativePath);
}

/**
 * Extract text from file (supports multiple formats)
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const ext = path.extname(file.name).toLowerCase();

  // Simple text file
  if (ext === '.txt') {
    return await file.text();
  }

  // Word documents (.docx)
  if (ext === '.docx') {
    try {
      const mammoth = require('mammoth');
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      console.error('Error extracting text from DOCX:', error);
      return '';
    }
  }

  // PDF documents
  if (ext === '.pdf') {
    try {
      const pdfParse = require('pdf-parse');
      const buffer = Buffer.from(await file.arrayBuffer());
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      return '';
    }
  }

  // Excel documents (.xlsx)
  if (ext === '.xlsx' || ext === '.xls') {
    try {
      const XLSX = require('xlsx');
      const buffer = Buffer.from(await file.arrayBuffer());
      const workbook = XLSX.read(buffer);
      let text = '';
      
      workbook.SheetNames.forEach((sheetName: string) => {
        const sheet = workbook.Sheets[sheetName];
        text += XLSX.utils.sheet_to_txt(sheet) + '\n';
      });
      
      return text;
    } catch (error) {
      console.error('Error extracting text from Excel:', error);
      return '';
    }
  }

  // PowerPoint documents (.pptx)
  if (ext === '.pptx' || ext === '.ppt') {
    try {
      const officeParser = require('officeparser');
      const buffer = Buffer.from(await file.arrayBuffer());
      const text = await officeParser.parseOfficeAsync(buffer);
      return text || '';
    } catch (error) {
      console.error('Error extracting text from PowerPoint:', error);
      return '';
    }
  }

  // Old Word format (.doc) - requires officeparser
  if (ext === '.doc') {
    try {
      const officeParser = require('officeparser');
      const buffer = Buffer.from(await file.arrayBuffer());
      const text = await officeParser.parseOfficeAsync(buffer);
      return text || '';
    } catch (error) {
      console.error('Error extracting text from DOC:', error);
      return '';
    }
  }

  throw new Error(
    `Nepodržan format fajla za ekstrakciju teksta. Podržani formati su: ${SUPPORTED_EXTENSIONS.join(', ')}`
  );
}

/**
 * Get file MIME type based on extension
 */
export function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  
  const mimeTypes: { [key: string]: string } = {
    '.txt': 'text/plain',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.pdf': 'application/pdf',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  };

  return mimeTypes[ext] || 'application/octet-stream';
}
