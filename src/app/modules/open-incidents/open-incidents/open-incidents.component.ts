import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, map } from 'rxjs';
import { IncidentService } from '../../../core/services/incident.service';
import { Incident } from '../../../core/models/incident.model';
import { IncidentTableComponent } from '../../../shared/components/incident-table/incident-table.component';

@Component({
  selector: 'app-open-incidents',
  standalone: true,
  imports: [CommonModule, IncidentTableComponent],
  template: `
    <div class="page-container">
      <app-incident-table 
        [incidents]="(openIncidents$ | async) || []"
        [title]="'Incidentes Abiertos'"
        [showResolved]="false">
      </app-incident-table>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 2rem;
    }
  `]
})
export class OpenIncidentsComponent implements OnInit {
  openIncidents$!: Observable<Incident[]>;

  constructor(private incidentService: IncidentService) {}

  ngOnInit(): void {
    this.openIncidents$ = this.incidentService.getIncidents().pipe(
      map(incidents => this.incidentService.getOpenIncidents())
    );
  }
}
