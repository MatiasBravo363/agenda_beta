import { Routes } from '@angular/router';
import { provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { BarChart, FunnelChart, HeatmapChart, LineChart, PieChart } from 'echarts/charts';
import {
  GraphicComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// IMPORTANTE: ngx-echarts usa partial-import (tree-shaking) para mantener
// el bundle bajo. Cualquier `type: 'X'` en una serie de echarts requiere
// que XChart esté registrado acá. Igual para componentes (visualMap, graphic).
// Si agregás un chart nuevo al dashboard, registrá su tipo acá o no
// va a renderizar (silenciosamente, sin warning).
echarts.use([
  // Charts
  LineChart, PieChart, BarChart, FunnelChart, HeatmapChart,
  // Componentes
  GridComponent, LegendComponent, TooltipComponent, TitleComponent,
  VisualMapComponent, GraphicComponent,
  // Renderer
  CanvasRenderer,
]);

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard.component').then((m) => m.DashboardComponent),
    providers: [provideEchartsCore({ echarts })],
  },
];
