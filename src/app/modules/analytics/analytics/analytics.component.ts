import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { ExportService } from '../../../core/services/export.service';
import { IncidentService } from '../../../core/services/incident.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

// Registrar componentes de Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent implements OnInit, AfterViewInit {
  @ViewChild('analystChart') analystChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('priorityChart') priorityChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendChart') trendChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('comparisonChart') comparisonChartRef!: ElementRef<HTMLCanvasElement>;

  private charts: Chart[] = [];
  dataLoaded = false;

  constructor(
    private analyticsService: AnalyticsService,
    private exportService: ExportService,
    private incidentService: IncidentService
  ) {}

  ngOnInit(): void {
    // Los gráficos se crearán en ngAfterViewInit
  }

  ngAfterViewInit(): void {
    // Esperar un tick para asegurar que las vistas estén listas
    setTimeout(() => this.loadCharts(), 100);
  }

  loadCharts(): void {
    this.createAnalystChart();
    this.createPriorityChart();
    this.createTrendChart();
    this.createComparisonChart();
    this.dataLoaded = true;
  }

  private createAnalystChart(): void {
    this.analyticsService.getIncidentsByAnalystChart().subscribe(config => {
      const ctx = this.analystChartRef.nativeElement.getContext('2d');
      if (ctx) {
        const chartConfig: ChartConfiguration = {
          type: config.type as any,
          data: config.data,
          options: config.options as any
        };
        this.charts.push(new Chart(ctx, chartConfig));
      }
    });
  }

  private createPriorityChart(): void {
    this.analyticsService.getPriorityDistributionChart().subscribe(config => {
      const ctx = this.priorityChartRef.nativeElement.getContext('2d');
      if (ctx) {
        const chartConfig: ChartConfiguration = {
          type: config.type as any,
          data: config.data,
          options: config.options as any
        };
        this.charts.push(new Chart(ctx, chartConfig));
      }
    });
  }

  private createTrendChart(): void {
    this.analyticsService.getDailyTrendChart().subscribe(config => {
      const ctx = this.trendChartRef.nativeElement.getContext('2d');
      if (ctx) {
        const chartConfig: ChartConfiguration = {
          type: config.type as any,
          data: config.data,
          options: config.options as any
        };
        this.charts.push(new Chart(ctx, chartConfig));
      }
    });
  }

  private createComparisonChart(): void {
    this.analyticsService.getOpenVsResolvedChart().subscribe(config => {
      const ctx = this.comparisonChartRef.nativeElement.getContext('2d');
      if (ctx) {
        const chartConfig: ChartConfiguration = {
          type: config.type as any,
          data: config.data,
          options: config.options as any
        };
        this.charts.push(new Chart(ctx, chartConfig));
      }
    });
  }

  exportData(format: 'csv' | 'xlsx'): void {
    this.incidentService.getIncidents().subscribe(incidents => {
      this.exportService.export(incidents, { format, includeFilters: false }, 'analisis_incidentes');
    });
  }

  ngOnDestroy(): void {
    // Limpiar gráficos al destruir el componente
    this.charts.forEach(chart => chart.destroy());
  }
}
