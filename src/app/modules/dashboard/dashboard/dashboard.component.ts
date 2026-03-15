import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { KpiService } from '../../../core/services/kpi.service';
import { DashboardKPI } from '../../../core/models/incident.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  kpis$!: Observable<DashboardKPI>;

  constructor(private kpiService: KpiService) {}

  ngOnInit(): void {
    this.kpis$ = this.kpiService.getDashboardKPIs();
  }

  /**
   * Formatea número con separador de miles
   */
  formatNumber(value: number): string {
    return value.toLocaleString('es-ES');
  }

  /**
   * Formatea porcentaje
   */
  formatPercentage(value: number): string {
    return value.toFixed(1) + '%';
  }

  /**
   * Formatea horas
   */
  formatHours(hours: number): string {
    if (hours < 24) {
      return hours.toFixed(1) + ' hrs';
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours.toFixed(0)}h`;
  }
}
