import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { FileHistoryService } from '../../../core/services/file-history.service';
import { FileUpload } from '../../../core/models/incident.model';

@Component({
  selector: 'app-file-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-history.component.html',
  styleUrls: ['./file-history.component.scss']
})
export class FileHistoryComponent implements OnInit {
  history$!: Observable<FileUpload[]>;
  stats: { totalFiles: number; totalIncidents: number } = { totalFiles: 0, totalIncidents: 0 };

  constructor(private fileHistoryService: FileHistoryService) {}

  ngOnInit(): void {
    this.history$ = this.fileHistoryService.getHistory();
    this.stats = this.fileHistoryService.getHistoryStats();
  }

  formatDate(date: Date): string {
    const d = new Date(date);
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();
    const hours = String(d.getUTCHours()).padStart(2, '0');
    const minutes = String(d.getUTCMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  removeFile(id: string): void {
    if (confirm('¿Está seguro de eliminar este archivo del historial?')) {
      this.fileHistoryService.removeFile(id);
      this.stats = this.fileHistoryService.getHistoryStats();
    }
  }

  clearHistory(): void {
    if (confirm('¿Está seguro de limpiar todo el historial? Esta acción no se puede deshacer.')) {
      this.fileHistoryService.clearHistory();
      this.stats = this.fileHistoryService.getHistoryStats();
    }
  }
}
