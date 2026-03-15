import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, map } from 'rxjs';
import { IncidentService } from '../../../core/services/incident.service';
import { Incident } from '../../../core/models/incident.model';
import { IncidentTableComponent } from '../../../shared/components/incident-table/incident-table.component';

@Component({
  selector: 'app-resolved-incidents',
  standalone: true,
  imports: [CommonModule, IncidentTableComponent],
  template: `
    <div class="page-container">
      <app-incident-table 
        [incidents]="(resolvedIncidents$ | async) || []"
        [title]="'Incidentes Resueltos'"
        [showResolved]="true">
      </app-incident-table>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 2rem;
    }
  `]
})
export class ResolvedIncidentsComponent implements OnInit {
  resolvedIncidents$!: Observable<Incident[]>;

  constructor(private incidentService: IncidentService) {}

  ngOnInit(): void {
    this.resolvedIncidents$ = this.incidentService.getIncidents().pipe(
      map(incidents => this.incidentService.getResolvedIncidents())
    );
  }
}
