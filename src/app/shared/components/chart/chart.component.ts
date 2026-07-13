import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { ChartConfig } from '../../../core/models/chart.model';

Chart.register(...registerables);

/**
 * Wrapper mínimo de Chart.js: crea/actualiza/destruye el gráfico según [config].
 * Evita repetir el boilerplate de @ViewChild + Chart.register en cada componente.
 */
@Component({
  selector: 'app-chart',
  standalone: true,
  templateUrl: './chart.component.html'
})
export class ChartComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() config!: ChartConfig;
  @Input() height = 320;

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] && this.config && this.chartCanvas) {
      this.renderChart();
    }
  }

  ngAfterViewInit(): void {
    if (this.config) {
      this.renderChart();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private renderChart(): void {
    this.chart?.destroy();
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    this.chart = new Chart(ctx, this.config as ChartConfiguration);
  }
}
