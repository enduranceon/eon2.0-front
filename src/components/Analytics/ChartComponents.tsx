'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
  Chip,
  Grid,
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
} from '@mui/icons-material';

// Componente de KPI Card com tendência
interface KPICardProps {
  title: string;
  value: string | number;
  trend?: number;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  subtitle?: string;
}

export function KPICard({ title, value, trend, color = 'primary', subtitle }: KPICardProps) {
  const theme = useTheme();

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend > 0) return <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />;
    if (trend < 0) return <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />;
    return <TrendingFlatIcon sx={{ fontSize: 16, color: 'text.secondary' }} />;
  };

  const getTrendColor = () => {
    if (!trend) return 'text.secondary';
    return trend > 0 ? 'success.main' : trend < 0 ? 'error.main' : 'text.secondary';
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" fontWeight="bold" color={`${color}.main`} sx={{ mb: 1 }}>
          {value}
        </Typography>
        {trend !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {getTrendIcon()}
            <Typography variant="caption" color={getTrendColor()}>
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// Gráfico de linha para métricas temporais
interface LineChartComponentProps {
  data: any[];
  title: string;
  xKey: string;
  yKey: string;
  height?: number;
  color?: string;
  showArea?: boolean;
}

export function LineChartComponent({ 
  data, 
  title, 
  xKey, 
  yKey, 
  height = 300, 
  color = '#8884d8',
  showArea = false 
}: LineChartComponentProps) {
  const theme = useTheme();

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          {title}
        </Typography>
        <ResponsiveContainer width="100%" height={height}>
          {showArea ? (
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} />
              <YAxis />
              <Tooltip 
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 8,
                }}
              />
              <Area 
                type="monotone" 
                dataKey={yKey} 
                stroke={color} 
                fill={color}
                fillOpacity={0.3}
              />
            </AreaChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} />
              <YAxis />
              <Tooltip 
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 8,
                }}
              />
              <Line 
                type="monotone" 
                dataKey={yKey} 
                stroke={color} 
                strokeWidth={2}
                dot={{ fill: color, strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Gráfico de barras
interface BarChartComponentProps {
  data: any[];
  title: string;
  xKey: string;
  yKey: string;
  height?: number;
  color?: string;
}

export function BarChartComponent({ 
  data, 
  title, 
  xKey, 
  yKey, 
  height = 300, 
  color = '#82ca9d' 
}: BarChartComponentProps) {
  const theme = useTheme();

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          {title}
        </Typography>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip 
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 8,
              }}
            />
            <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Gráfico de pizza
interface PieChartComponentProps {
  data: any[];
  title: string;
  height?: number;
  showLegend?: boolean;
}

export function PieChartComponent({ 
  data, 
  title, 
  height = 300, 
  showLegend = true 
}: PieChartComponentProps) {
  const theme = useTheme();
  
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          {title}
        </Typography>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            {showLegend && (
              <Tooltip 
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 8,
                }}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
        
        {/* Legend customizada */}
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={1}>
            {data.map((entry, index) => (
              <Grid item xs={6} sm={4} key={entry.name}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: 1,
                      backgroundColor: entry.color || COLORS[index % COLORS.length],
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {entry.name}
                  </Typography>
                  <Typography variant="caption" fontWeight="bold">
                    {entry.value}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
}

// Gráfico combinado (linha + barra)
interface ComboChartComponentProps {
  data: any[];
  title: string;
  xKey: string;
  lineKey: string;
  barKey: string;
  lineLabel: string;
  barLabel: string;
  height?: number;
}

export function ComboChartComponent({ 
  data, 
  title, 
  xKey, 
  lineKey, 
  barKey, 
  lineLabel, 
  barLabel, 
  height = 300 
}: ComboChartComponentProps) {
  const theme = useTheme();

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          {title}
        </Typography>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip 
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 8,
              }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey={barKey} name={barLabel} fill="#8884d8" />
            <Area 
              yAxisId="right" 
              type="monotone" 
              dataKey={lineKey} 
              name={lineLabel}
              stroke="#82ca9d" 
              fill="#82ca9d"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Widget de insights com chips
interface InsightsWidgetProps {
  title: string;
  insights: string[];
  variant?: 'standard' | 'compact';
}

export function InsightsWidget({ title, insights, variant = 'standard' }: InsightsWidgetProps) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          {title}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: variant === 'compact' ? 1 : 1.5 }}>
          {insights.map((insight, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Chip
                size="small"
                label={index + 1}
                color="primary"
                sx={{ minWidth: 24, height: 20, '& .MuiChip-label': { px: 0.5 } }}
              />
              <Typography 
                variant={variant === 'compact' ? 'caption' : 'body2'} 
                color="text.secondary"
                sx={{ lineHeight: variant === 'compact' ? 1.3 : 1.5 }}
              >
                {insight}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

// Tabela de performance com ranking
interface PerformanceTableProps {
  title: string;
  data: any[];
  columns: { key: string; label: string; format?: (value: any) => string }[];
  height?: number;
}

export function PerformanceTable({ title, data, columns, height = 300 }: PerformanceTableProps) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          {title}
        </Typography>
        <Box sx={{ maxHeight: height, overflow: 'auto' }}>
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
            <Box component="thead">
              <Box component="tr">
                {columns.map((column) => (
                  <Box
                    key={column.key}
                    component="th"
                    sx={{
                      textAlign: 'left',
                      p: 1,
                      borderBottom: 1,
                      borderColor: 'divider',
                      fontWeight: 'bold',
                      fontSize: '0.875rem',
                    }}
                  >
                    {column.label}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box component="tbody">
              {data.map((row, index) => (
                <Box 
                  key={index} 
                  component="tr"
                  sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                >
                  {columns.map((column) => (
                    <Box
                      key={column.key}
                      component="td"
                      sx={{
                        p: 1,
                        borderBottom: 1,
                        borderColor: 'divider',
                        fontSize: '0.875rem',
                      }}
                    >
                      {column.format ? column.format(row[column.key]) : row[column.key]}
                    </Box>
                  ))}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
} 