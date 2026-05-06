import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';
import type { LatencyDataPoint, UptimeDataPoint } from '@/types';

const COLORS = {
  up: '#10b981', down: '#ef4444', warn: '#f59e0b', blue: '#0ea5e9',
  grid: 'rgba(148,163,184,0.12)', tick: '#94a3b8',
};

const tooltipStyle = {
  contentStyle: { background: '#0f172a', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px', fontSize: '12px', color: '#e2e8f0' },
  labelStyle: { color: '#94a3b8', marginBottom: '4px' },
  cursor: { stroke: 'rgba(14,165,233,0.4)', strokeWidth: 1 },
};

// ─── Latency Line Chart ────────────────────────────────────────────────────────
interface LatencyChartProps { data: LatencyDataPoint[]; height?: number; }
export function LatencyChart({ data, height = 200 }: LatencyChartProps) {
  const formatted = data.map(d => ({
    ...d,
    time: format(new Date(d.timestamp), 'HH:mm'),
    latency: d.latencyMs,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={formatted} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.2} />
            <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
        <XAxis dataKey="time" tick={{ fontSize: 11, fill: COLORS.tick }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 11, fill: COLORS.tick }} tickLine={false} axisLine={false} tickFormatter={v => `${v}ms`} />
        <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v}ms`, 'Latency']} />
        <Area type="monotone" dataKey="latency" stroke={COLORS.blue} strokeWidth={2} fill="url(#latencyGrad)" connectNulls={false} dot={false} activeDot={{ r: 4, fill: COLORS.blue, stroke: '#fff', strokeWidth: 2 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Uptime Bar Chart ─────────────────────────────────────────────────────────
interface UptimeChartProps { data: UptimeDataPoint[]; height?: number; }
export function UptimeChart({ data, height = 160 }: UptimeChartProps) {
  const formatted = data.map(d => ({
    date: format(new Date(d.timestamp), 'MMM d'),
    uptime: d.uptimePercent,
    fill: d.uptimePercent >= 99 ? COLORS.up : d.uptimePercent >= 95 ? COLORS.warn : COLORS.down,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={formatted} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={6} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} horizontal={true} vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: COLORS.tick }} tickLine={false} axisLine={false} interval={6} />
        <YAxis domain={[90, 100]} tick={{ fontSize: 10, fill: COLORS.tick }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
        <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v.toFixed(3)}%`, 'Uptime']} />
        <ReferenceLine y={99} stroke={COLORS.up} strokeDasharray="4 2" strokeWidth={1} strokeOpacity={0.6} />
        <Bar dataKey="uptime" radius={[2, 2, 0, 0]}>
          {formatted.map((entry, index) => <Cell key={index} fill={entry.fill} fillOpacity={0.85} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Status Pie Chart ─────────────────────────────────────────────────────────
interface StatusPieProps { up: number; down: number; degraded: number; }
export function StatusPieChart({ up, down, degraded }: StatusPieProps) {
  const data = [
    { name: 'UP', value: up, color: COLORS.up },
    { name: 'DOWN', value: down, color: COLORS.down },
    { name: 'DEGRADED', value: degraded, color: COLORS.warn },
  ].filter(d => d.value > 0);

  const total = up + down + degraded;

  return (
    <div className="relative flex items-center justify-center">
      <ResponsiveContainer width={160} height={160}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={52} outerRadius={72} paddingAngle={3} dataKey="value" strokeWidth={0}>
            {data.map((entry, index) => <Cell key={index} fill={entry.color} />)}
          </Pie>
          <Tooltip {...tooltipStyle} formatter={(v: number, name: string) => [`${v} (${((v / total) * 100).toFixed(0)}%)`, name]} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute flex flex-col items-center">
        <span className="font-display text-2xl font-700 text-surface-900 dark:text-white">{total}</span>
        <span className="text-xs text-surface-400">endpoints</span>
      </div>
    </div>
  );
}

// ─── Mini Sparkline ────────────────────────────────────────────────────────────
interface SparklineProps { data: number[]; color?: string; height?: number; }
export function Sparkline({ data, color = COLORS.blue, height = 40 }: SparklineProps) {
  const formatted = data.map((v, i) => ({ v, i }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={formatted} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
