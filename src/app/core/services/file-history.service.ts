import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FileUpload } from '../models/incident.model';

@Injectable({
  providedIn: 'root'
})
export class FileHistoryService {
  private history$ = new BehaviorSubject<FileUpload[]>([]);
  private readonly STORAGE_KEY = 'incident_file_history';

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Obtiene el historial de archivos
   */
  getHistory(): Observable<FileUpload[]> {
    return this.history$.asObservable();
  }

  /**
   * Agrega un archivo al historial
   */
  addFile(file: File, incidentCount: number, uploadedBy?: string): FileUpload {
    const fileUpload: FileUpload = {
      id: this.generateId(),
      fileName: file.name,
      uploadDate: new Date(),
      incidentCount,
      uploadedBy,
      fileSize: file.size
    };

    const history = this.history$.value;
    history.unshift(fileUpload);
    
    // Mantener solo los últimos 50 archivos
    if (history.length > 50) {
      history.pop();
    }

    this.history$.next(history);
    this.saveToStorage();

    return fileUpload;
  }

  /**
   * Elimina un archivo del historial
   */
  removeFile(id: string): void {
    const history = this.history$.value.filter(f => f.id !== id);
    this.history$.next(history);
    this.saveToStorage();
  }

  /**
   * Limpia todo el historial
   */
  clearHistory(): void {
    this.history$.next([]);
    this.saveToStorage();
  }

  /**
   * Carga el historial desde localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const history = JSON.parse(stored);
        // Convertir strings de fecha a objetos Date
        history.forEach((f: FileUpload) => {
          f.uploadDate = new Date(f.uploadDate);
        });
        this.history$.next(history);
      }
    } catch (error) {
      console.error('Error loading file history:', error);
    }
  }

  /**
   * Guarda el historial en localStorage
   */
  private saveToStorage(): void {
    try {
      const history = this.history$.value;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving file history:', error);
    }
  }

  /**
   * Genera un ID único
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtiene estadísticas del historial
   */
  getHistoryStats(): { totalFiles: number; totalIncidents: number } {
    const history = this.history$.value;
    return {
      totalFiles: history.length,
      totalIncidents: history.reduce((sum, f) => sum + f.incidentCount, 0)
    };
  }
}
