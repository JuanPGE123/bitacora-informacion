import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileParserService } from '../../../core/services/file-parser.service';
import { IncidentService } from '../../../core/services/incident.service';
import { FileHistoryService } from '../../../core/services/file-history.service';
import { FileProcessResult } from '../../../core/models/incident.model';

interface UploadSection {
  title: string;
  description: string;
  file: File | null;
  processing: boolean;
  result: FileProcessResult | null;
  dragOver: boolean;
}

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent {
  // Dos áreas de carga independientes
  openIncidentsUpload: UploadSection = {
    title: 'Incidentes Abiertos',
    description: 'Suba el archivo de incidentes abiertos (En Proceso, Pendientes, etc.)',
    file: null,
    processing: false,
    result: null,
    dragOver: false
  };

  resolvedIncidentsUpload: UploadSection = {
    title: 'Incidentes Resueltos',
    description: 'Suba el archivo de incidentes cerrados o resueltos',
    file: null,
    processing: false,
    result: null,
    dragOver: false
  };

  constructor(
    private fileParserService: FileParserService,
    private incidentService: IncidentService,
    private fileHistoryService: FileHistoryService
  ) {}

  /**
   * Maneja la selección de archivo para incidentes abiertos
   */
  onOpenFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectFile(input.files[0], this.openIncidentsUpload);
    }
  }

  /**
   * Maneja la selección de archivo para incidentes resueltos
   */
  onResolvedFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectFile(input.files[0], this.resolvedIncidentsUpload);
    }
  }

  /**
   * Maneja drag over para incidentes abiertos
   */
  onOpenDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.openIncidentsUpload.dragOver = true;
  }

  /**
   * Maneja drag leave para incidentes abiertos
   */
  onOpenDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.openIncidentsUpload.dragOver = false;
  }

  /**
   * Maneja drop para incidentes abiertos
   */
  onOpenDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.openIncidentsUpload.dragOver = false;

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.selectFile(event.dataTransfer.files[0], this.openIncidentsUpload);
    }
  }

  /**
   * Maneja drag over para incidentes resueltos
   */
  onResolvedDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.resolvedIncidentsUpload.dragOver = true;
  }

  /**
   * Maneja drag leave para incidentes resueltos
   */
  onResolvedDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.resolvedIncidentsUpload.dragOver = false;
  }

  /**
   * Maneja drop para incidentes resueltos
   */
  onResolvedDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.resolvedIncidentsUpload.dragOver = false;

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.selectFile(event.dataTransfer.files[0], this.resolvedIncidentsUpload);
    }
  }

  /**
   * Selecciona un archivo para una sección
   */
  private selectFile(file: File, section: UploadSection): void {
    const validation = this.fileParserService.validateFile(file);
    
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    section.file = file;
    section.result = null;
  }

  /**
   * Procesa el archivo de incidentes abiertos
   */
  async processOpenFile(): Promise<void> {
    if (!this.openIncidentsUpload.file) {
      return;
    }

    this.openIncidentsUpload.processing = true;
    this.openIncidentsUpload.result = null;

    try {
      const result = await this.fileParserService.parseFile(this.openIncidentsUpload.file);
      this.openIncidentsUpload.result = result;

      if (result.success && result.incidents.length > 0) {
        // Agregar incidentes abiertos al servicio
        this.incidentService.addOpenIncidents(result.incidents);
        
        // Agregar al historial
        this.fileHistoryService.addFile(
          this.openIncidentsUpload.file,
          result.incidents.length
        );
      }
    } catch (error) {
      this.openIncidentsUpload.result = {
        success: false,
        incidents: [],
        errors: [`Error inesperado: ${error}`],
        warnings: [],
        processedRows: 0,
        skippedRows: 0
      };
    } finally {
      this.openIncidentsUpload.processing = false;
    }
  }

  /**
   * Procesa el archivo de incidentes resueltos
   */
  async processResolvedFile(): Promise<void> {
    if (!this.resolvedIncidentsUpload.file) {
      return;
    }

    this.resolvedIncidentsUpload.processing = true;
    this.resolvedIncidentsUpload.result = null;

    try {
      const result = await this.fileParserService.parseFile(this.resolvedIncidentsUpload.file);
      this.resolvedIncidentsUpload.result = result;

      if (result.success && result.incidents.length > 0) {
        // Agregar incidentes resueltos al servicio
        this.incidentService.addResolvedIncidents(result.incidents);
        
        // Agregar al historial
        this.fileHistoryService.addFile(
          this.resolvedIncidentsUpload.file,
          result.incidents.length
        );
      }
    } catch (error) {
      this.resolvedIncidentsUpload.result = {
        success: false,
        incidents: [],
        errors: [`Error inesperado: ${error}`],
        warnings: [],
        processedRows: 0,
        skippedRows: 0
      };
    } finally {
      this.resolvedIncidentsUpload.processing = false;
    }
  }

  /**
   * Limpia la selección de incidentes abiertos
   */
  clearOpenSelection(): void {
    this.openIncidentsUpload.file = null;
    this.openIncidentsUpload.result = null;
  }

  /**
   * Limpia la selección de incidentes resueltos
   */
  clearResolvedSelection(): void {
    this.resolvedIncidentsUpload.file = null;
    this.resolvedIncidentsUpload.result = null;
  }

  /**
   * Formatea el tamaño del archivo
   */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }
}
