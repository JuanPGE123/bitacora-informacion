import { Routes } from '@angular/router';
import { DashboardComponent } from './modules/dashboard/dashboard/dashboard.component';
import { FileUploadComponent } from './modules/upload/file-upload/file-upload.component';
import { OpenIncidentsComponent } from './modules/open-incidents/open-incidents/open-incidents.component';
import { ResolvedIncidentsComponent } from './modules/resolved-incidents/resolved-incidents/resolved-incidents.component';
import { AnalyticsComponent } from './modules/analytics/analytics/analytics.component';
import { OpenIncidentsAnalyticsComponent } from './modules/analytics/open-incidents-analytics/open-incidents-analytics.component';
import { ResolvedIncidentsAnalyticsComponent } from './modules/analytics/resolved-incidents-analytics/resolved-incidents-analytics.component';
import { ByAnalystComponent } from './modules/analytics/by-analyst/by-analyst.component';
import { QuoteBranchComponent } from './modules/analytics/quote-branch/quote-branch.component';
import { ResolvedByAnalystComponent } from './modules/analytics/resolved-by-analyst/resolved-by-analyst.component';
import { FileHistoryComponent } from './modules/history/file-history/file-history.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'upload', component: FileUploadComponent },
  { path: 'open-incidents', component: OpenIncidentsComponent },
  { path: 'resolved-incidents', component: ResolvedIncidentsComponent },
  { path: 'analytics', component: AnalyticsComponent },
  { path: 'analytics/open', component: OpenIncidentsAnalyticsComponent },
  { path: 'analytics/resolved', component: ResolvedIncidentsAnalyticsComponent },
  { path: 'analytics/by-analyst', component: ByAnalystComponent },
  { path: 'analytics/quote-branch', component: QuoteBranchComponent },
  { path: 'analytics/resolved-by-analyst', component: ResolvedByAnalystComponent },
  { path: 'history', component: FileHistoryComponent },
  { path: '**', redirectTo: '/dashboard' }
];
