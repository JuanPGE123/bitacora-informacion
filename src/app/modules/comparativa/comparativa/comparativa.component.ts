import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ComparisonResult, ComparisonService } from '../../../core/services/comparison.service';
import { formatHoursDuration } from '../../../core/utils/business-hours.util';

@Component({
  selector: 'app-comparativa',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comparativa.component.html',
  styleUrls: ['./comparativa.component.scss']
})
export class ComparativaComponent implements OnInit, OnDestroy {
  comparison: ComparisonResult | null = null;
  private subscription?: Subscription;

  constructor(private comparisonService: ComparisonService) {}

  ngOnInit(): void {
    this.subscription = this.comparisonService.getLastComparison().subscribe(result => {
      this.comparison = result;
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  formatDateTime(date?: Date): string {
    if (!date) return '—';
    return new Date(date).toLocaleString('es-CO', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  formatDuration(hours: number): string {
    return formatHoursDuration(hours);
  }

  onTimeStatusLabel(onTime: boolean | null): string {
    if (onTime === null) return 'Indeterminado';
    return onTime ? 'A Tiempo' : 'Fuera de Tiempo';
  }

  onTimeBadgeClass(onTime: boolean | null): string {
    if (onTime === null) return 'badge-neutral';
    return onTime ? 'badge-success' : 'badge-danger';
  }

  closeDateSourceLabel(source: string): string {
    switch (source) {
      case 'resueltos': return 'Archivo Resueltos';
      case 'archivo-anterior': return 'Dato en archivo anterior';
      default: return 'Sin fecha de cierre';
    }
  }
}
