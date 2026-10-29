import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';

// Official Gov Color Palette
export const CHART_COLORS = {
  navy: '#1e3a8a',
  blue: '#2563eb',
  sky: '#0284c7',
  emerald: '#059669',
  amber: '#d97706',
  orange: '#ea580c',
  red: '#dc2626',
  slate: '#64748b',
  lightSlate: '#e2e8f0',
  indigo: '#4f46e5'
};

interface StatusSlice {
  name: string;
  value: number;
  color: string;
}

interface StatusDonutProps {
  data: StatusSlice[];
  title?: string;
  subtitle?: string;
  height?: number;
}

export function StatusDonutChart({ data, title, subtitle, height = 240 }: StatusDonutProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="gov-card chart-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {title && (
        <div style={{ marginBottom: '10px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: 0 }}>{title}</h4>
          {subtitle && <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0' }}>{subtitle}</p>}
        </div>
      )}
      <div style={{ flex: 1, minHeight: height, position: 'relative' }}>
        {total === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '12px' }}>
            No records in current view
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#cbd5e1',
                  borderRadius: '6px',
                  fontSize: '11px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

interface SeverityBarProps {
  critical: number;
  high: number;
  medium: number;
  low: number;
  cleared?: number;
  title?: string;
  subtitle?: string;
  height?: number;
}

export function DeficiencySeverityBarChart({
  critical,
  high,
  medium,
  low,
  cleared = 0,
  title = "Deficiency Severity Breakdown",
  subtitle = "Statutory findings detected across submissions",
  height = 240
}: SeverityBarProps) {
  const chartData = [
    { name: 'Critical', count: critical, color: CHART_COLORS.red },
    { name: 'High', count: high, color: CHART_COLORS.orange },
    { name: 'Medium', count: medium, color: CHART_COLORS.amber },
    { name: 'Low', count: low, color: CHART_COLORS.blue },
    ...(cleared > 0 ? [{ name: 'Cleared', count: cleared, color: CHART_COLORS.emerald }] : [])
  ];

  const total = critical + high + medium + low + cleared;

  return (
    <div className="gov-card chart-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '10px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: 0 }}>{title}</h4>
        {subtitle && <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0' }}>{subtitle}</p>}
      </div>
      <div style={{ flex: 1, minHeight: height }}>
        {total === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#059669', fontSize: '12px', fontWeight: '600' }}>
            ✓ No statutory deficiencies detected
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#475569' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#cbd5e1',
                  borderRadius: '6px',
                  fontSize: '11px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

interface WorkloadItem {
  stage: string;
  count: number;
  color?: string;
}

interface WorkloadBarProps {
  data: WorkloadItem[];
  title?: string;
  subtitle?: string;
  height?: number;
}

export function WorkloadDistributionBarChart({
  data,
  title = "Scrutiny Queue Workload",
  subtitle = "Applications distributed across processing stages",
  height = 240
}: WorkloadBarProps) {
  return (
    <div className="gov-card chart-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '10px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: 0 }}>{title}</h4>
        {subtitle && <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0' }}>{subtitle}</p>}
      </div>
      <div style={{ flex: 1, minHeight: height }}>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="stage" tick={{ fontSize: 10.5, fill: '#475569' }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#475569' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#cbd5e1',
                borderRadius: '6px',
                fontSize: '11px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }}
            />
            <Bar dataKey="count" fill={CHART_COLORS.navy} radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`workload-${index}`} fill={entry.color || CHART_COLORS.navy} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface CategoryScore {
  category: string;
  adherenceRate: number; // 0 to 100
  totalRules: number;
}

interface CategoryBarProps {
  data: CategoryScore[];
  title?: string;
  subtitle?: string;
  height?: number;
}

export function ComplianceCategoryBarChart({
  data,
  title = "Statutory Adherence by Regulatory Category",
  subtitle = "Compliance pass percentage across official APH 2026-27 norms",
  height = 240
}: CategoryBarProps) {
  return (
    <div className="gov-card chart-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '10px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: 0 }}>{title}</h4>
        {subtitle && <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0' }}>{subtitle}</p>}
      </div>
      <div style={{ flex: 1, minHeight: height }}>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 35, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10.5, fill: '#475569' }} unit="%" />
            <YAxis type="category" dataKey="category" tick={{ fontSize: 10.5, fill: '#1e293b' }} width={90} />
            <Tooltip
              formatter={(val: any) => [`${val}% Adherence`, 'Compliance Rate']}
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#cbd5e1',
                borderRadius: '6px',
                fontSize: '11px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }}
            />
            <Bar dataKey="adherenceRate" fill={CHART_COLORS.emerald} radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cat-${index}`}
                  fill={entry.adherenceRate >= 90 ? CHART_COLORS.emerald : (entry.adherenceRate >= 70 ? CHART_COLORS.blue : CHART_COLORS.amber)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface ScoreBucket {
  range: string;
  count: number;
}

interface ScoreHistProps {
  data: ScoreBucket[];
  title?: string;
  subtitle?: string;
  height?: number;
}

export function VerificationScoreAreaChart({
  data,
  title = "AI Trust & Compliance Score Distribution",
  subtitle = "Application validation scores across evaluation tiers",
  height = 240
}: ScoreHistProps) {
  return (
    <div className="gov-card chart-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '10px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: 0 }}>{title}</h4>
        {subtitle && <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0' }}>{subtitle}</p>}
      </div>
      <div style={{ flex: 1, minHeight: height }}>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.navy} stopOpacity={0.4} />
                <stop offset="95%" stopColor={CHART_COLORS.navy} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="range" tick={{ fontSize: 10.5, fill: '#475569' }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#475569' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#cbd5e1',
                borderRadius: '6px',
                fontSize: '11px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke={CHART_COLORS.navy}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#scoreColor)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface ActivityItem {
  day: string;
  validations: number;
  audits: number;
}

interface ActivityChartProps {
  data: ActivityItem[];
  title?: string;
  subtitle?: string;
  height?: number;
}

export function ActivityTimelineChart({
  data,
  title = "System Activity & Validation Runs",
  subtitle = "Daily multi-agent validations and audit events logged",
  height = 240
}: ActivityChartProps) {
  return (
    <div className="gov-card chart-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '10px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: 0 }}>{title}</h4>
        {subtitle && <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0' }}>{subtitle}</p>}
      </div>
      <div style={{ flex: 1, minHeight: height }}>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="valColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.blue} stopOpacity={0.4} />
                <stop offset="95%" stopColor={CHART_COLORS.blue} stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="audColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.emerald} stopOpacity={0.4} />
                <stop offset="95%" stopColor={CHART_COLORS.emerald} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="day" tick={{ fontSize: 10.5, fill: '#475569' }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#475569' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#cbd5e1',
                borderRadius: '6px',
                fontSize: '11px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }}
            />
            <Legend verticalAlign="bottom" height={28} wrapperStyle={{ fontSize: '11px' }} />
            <Area
              type="monotone"
              name="Validations"
              dataKey="validations"
              stroke={CHART_COLORS.blue}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#valColor)"
            />
            <Area
              type="monotone"
              name="Audit Events"
              dataKey="audits"
              stroke={CHART_COLORS.emerald}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#audColor)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
