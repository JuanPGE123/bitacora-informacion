import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AnalystNotionData {
  analyst: string;
  totalIncidents: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  incidents: string[];
}

export interface NotionSyncResponse {
  success: boolean;
  message: string;
  results: any[];
}

@Injectable({
  providedIn: 'root'
})
export class NotionService {
  // Cambiar esta URL cuando tengas el endpoint de Vercel desplegado
  private apiUrl = environment.notionApiUrl || 'http://localhost:3000/api/notion-sync';

  constructor(private http: HttpClient) {}

  syncAnalystsToNotion(analysts: AnalystNotionData[]): Observable<NotionSyncResponse> {
    return this.http.post<NotionSyncResponse>(this.apiUrl, { analysts });
  }
}
