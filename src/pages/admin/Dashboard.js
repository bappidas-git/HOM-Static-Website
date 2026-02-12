import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
} from '@mui/material';
import { Icon } from '@iconify/react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { propertyService, leadService, articleService } from '../../services/api';

// Animated counter hook
const useAnimatedCount = (target, duration = 1200) => {
  const [count, setCount] = useState(0);
  const frameRef = useRef();

  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    const startTime = performance.now();
    const animate = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.floor(eased * target));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return count;
};

// Stats Card Component
const StatsCard = ({ icon, iconColor, iconBg, label, value, subLabel, trend, trendUp, loading }) => {
  const animatedValue = useAnimatedCount(loading ? 0 : value);

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        transition: 'box-shadow 0.2s ease',
        '&:hover': {
          boxShadow: '0px 8px 24px rgba(0,0,0,0.08)',
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            bgcolor: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon icon={icon} style={{ fontSize: 24, color: iconColor }} />
        </Box>
        {trend && (
          <Chip
            size="small"
            icon={
              <Icon
                icon={trendUp ? 'mdi:trending-up' : 'mdi:trending-down'}
                style={{ fontSize: 14 }}
              />
            }
            label={trend}
            sx={{
              height: 24,
              fontSize: '0.7rem',
              fontWeight: 600,
              bgcolor: trendUp ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              color: trendUp ? '#059669' : '#DC2626',
              '& .MuiChip-icon': { color: 'inherit' },
            }}
          />
        )}
      </Box>
      <Box>
        {loading ? (
          <Skeleton width={60} height={40} />
        ) : (
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1B2A4A', fontFamily: 'DM Sans' }}>
            {animatedValue.toLocaleString()}
          </Typography>
        )}
        <Typography variant="body2" sx={{ color: '#6B7280', fontWeight: 500 }}>
          {label}
        </Typography>
        {subLabel && (
          <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
            {subLabel}
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

// Lead status config
const leadStatusConfig = {
  new: { label: 'New', color: '#3B82F6', bg: '#EFF6FF' },
  contacted: { label: 'Contacted', color: '#F59E0B', bg: '#FFFBEB' },
  qualified: { label: 'Qualified', color: '#10B981', bg: '#ECFDF5' },
  converted: { label: 'Converted', color: '#B45309', bg: '#FEF3C7' },
  lost: { label: 'Lost', color: '#EF4444', bg: '#FEF2F2' },
};

// Simple SVG Donut Chart
const DonutChart = ({ data, size = 160 }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 20;
  const strokeWidth = 28;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((item, i) => {
          const pct = item.value / total;
          const dashArray = `${pct * circumference} ${circumference}`;
          const dashOffset = -offset;
          offset += pct * circumference;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{ transition: 'stroke-dasharray 0.8s ease' }}
            />
          );
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="22" fontWeight="700" fill="#1B2A4A">
          {total}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11" fill="#9CA3AF">
          Total
        </text>
      </svg>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {data.map((item, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: item.color, flexShrink: 0 }} />
            <Typography variant="caption" sx={{ color: '#6B7280' }}>
              {item.label}: <strong style={{ color: '#1B2A4A' }}>{item.value}</strong>
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

// Simple bar chart
const BarChart = ({ data, maxHeight = 120 }) => {
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: maxHeight + 30, pt: 2 }}>
      {data.map((item, i) => (
        <Box key={i} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          <Typography variant="caption" sx={{ color: '#6B7280', mb: 0.5, fontWeight: 600 }}>
            {item.value}
          </Typography>
          <Box
            sx={{
              width: '100%',
              maxWidth: 40,
              height: Math.max((item.value / maxVal) * maxHeight, 4),
              bgcolor: item.color || '#1B2A4A',
              borderRadius: '4px 4px 0 0',
              transition: 'height 0.8s ease',
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: '#9CA3AF',
              mt: 0.5,
              fontSize: '0.625rem',
              textAlign: 'center',
              lineHeight: 1.2,
            }}
          >
            {item.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeProperties: 0,
    inactiveProperties: 0,
    totalLeads: 0,
    newLeads7Days: 0,
    totalArticles: 0,
    publishedArticles: 0,
    draftArticles: 0,
  });
  const [recentLeads, setRecentLeads] = useState([]);
  const [properties, setProperties] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [allProperties, allLeads, allArticles] = await Promise.all([
        propertyService.getAll(),
        leadService.getAll(),
        articleService.getAll(),
      ]);

      // Properties stats
      const activeProps = allProperties.filter((p) => p.isActive);
      const inactiveProps = allProperties.filter((p) => !p.isActive);

      // Lead stats — new leads in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const newLeads7 = allLeads.filter(
        (l) => new Date(l.createdAt) >= sevenDaysAgo
      );

      // Article stats
      const published = allArticles.filter((a) => a.isActive);
      const drafts = allArticles.filter((a) => !a.isActive);

      setStats({
        totalProperties: allProperties.length,
        activeProperties: activeProps.length,
        inactiveProperties: inactiveProps.length,
        totalLeads: allLeads.length,
        newLeads7Days: newLeads7.length,
        totalArticles: allArticles.length,
        publishedArticles: published.length,
        draftArticles: drafts.length,
      });

      setRecentLeads(
        [...allLeads]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 10)
      );
      setProperties(allProperties);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Current date
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Lead source data for chart
  const leadsBySource = recentLeads.reduce((acc, lead) => {
    const src = lead.source || 'unknown';
    const label = src
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .replace('page', '')
      .trim();
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  const sourceBarData = Object.entries(leadsBySource).map(([label, value], i) => ({
    label: label.length > 10 ? label.slice(0, 10) + '...' : label,
    value,
    color: ['#1B2A4A', '#C9A86C', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'][i % 6],
  }));

  // Property status data for donut
  const propertyStatusData = [
    { label: 'Ready to Move', value: properties.filter((p) => p.status === 'ready-to-move').length, color: '#10B981' },
    { label: 'Under Construction', value: properties.filter((p) => p.status === 'under-construction').length, color: '#F59E0B' },
    { label: 'Pre-launch', value: properties.filter((p) => p.status === 'pre-launch').length, color: '#3B82F6' },
  ];

  const getPropertyTitle = (propertyId) => {
    const prop = properties.find((p) => p.id === propertyId);
    return prop ? prop.title : '—';
  };

  return (
    <Box>
      {/* Welcome Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1B2A4A', mb: 0.5 }}>
          Welcome back, {user?.name?.split(' ')[0] || 'Admin'}
        </Typography>
        <Typography variant="body2" sx={{ color: '#6B7280' }}>
          {today}
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatsCard
            icon="mdi:home-city-outline"
            iconColor="#1B2A4A"
            iconBg="rgba(27,42,74,0.08)"
            label="Total Properties"
            value={stats.totalProperties}
            subLabel={`${stats.activeProperties} active, ${stats.inactiveProperties} inactive`}
            trend="+12%"
            trendUp
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatsCard
            icon="mdi:account-group-outline"
            iconColor="#3B82F6"
            iconBg="rgba(59,130,246,0.08)"
            label="Total Leads"
            value={stats.totalLeads}
            subLabel={`${stats.newLeads7Days} new in last 7 days`}
            trend="+8%"
            trendUp
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatsCard
            icon="mdi:newspaper-variant-outline"
            iconColor="#10B981"
            iconBg="rgba(16,185,129,0.08)"
            label="Total Articles"
            value={stats.totalArticles}
            subLabel={`${stats.publishedArticles} published, ${stats.draftArticles} drafts`}
            trend="+5%"
            trendUp
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatsCard
            icon="mdi:eye-outline"
            iconColor="#8B5CF6"
            iconBg="rgba(139,92,246,0.08)"
            label="Website Visits"
            value={12847}
            subLabel="Last 30 days"
            trend="+18%"
            trendUp
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1B2A4A', mb: 2 }}>
              Leads by Source
            </Typography>
            {sourceBarData.length > 0 ? (
              <BarChart data={sourceBarData} />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 150, color: '#9CA3AF' }}>
                <Typography variant="body2">No lead data available</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1B2A4A', mb: 2 }}>
              Properties by Status
            </Typography>
            {properties.length > 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1 }}>
                <DonutChart data={propertyStatusData} />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 150, color: '#9CA3AF' }}>
                <Typography variant="body2">No property data available</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Leads Table */}
      <Paper sx={{ borderRadius: 3, mb: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 3, pb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1B2A4A' }}>
            Recent Leads
          </Typography>
          <Button
            size="small"
            variant="text"
            onClick={() => navigate('/admin/leads')}
            endIcon={<Icon icon="mdi:arrow-right" />}
            sx={{ color: '#6B7280', '&:hover': { color: '#1B2A4A' } }}
          >
            View All
          </Button>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280', fontSize: '0.75rem' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280', fontSize: '0.75rem' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280', fontSize: '0.75rem', display: { xs: 'none', sm: 'table-cell' } }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280', fontSize: '0.75rem', display: { xs: 'none', md: 'table-cell' } }}>Source</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280', fontSize: '0.75rem', display: { xs: 'none', lg: 'table-cell' } }}>Property</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280', fontSize: '0.75rem' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280', fontSize: '0.75rem', display: { xs: 'none', sm: 'table-cell' } }}>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : recentLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#9CA3AF' }}>
                    No leads found
                  </TableCell>
                </TableRow>
              ) : (
                recentLeads.map((lead) => {
                  const statusCfg = leadStatusConfig[lead.status] || leadStatusConfig.new;
                  return (
                    <TableRow
                      key={lead.id}
                      hover
                      sx={{ cursor: 'pointer', '&:last-child td': { border: 0 } }}
                      onClick={() => navigate(`/admin/leads/${lead.id}`)}
                    >
                      <TableCell sx={{ fontWeight: 500, color: '#1B2A4A', fontSize: '0.8125rem' }}>
                        {lead.name}
                      </TableCell>
                      <TableCell sx={{ color: '#6B7280', fontSize: '0.8125rem' }}>
                        {lead.email}
                      </TableCell>
                      <TableCell sx={{ color: '#6B7280', fontSize: '0.8125rem', display: { xs: 'none', sm: 'table-cell' } }}>
                        {lead.phone}
                      </TableCell>
                      <TableCell sx={{ color: '#6B7280', fontSize: '0.75rem', display: { xs: 'none', md: 'table-cell' } }}>
                        {lead.source?.replace(/-/g, ' ') || '—'}
                      </TableCell>
                      <TableCell sx={{ color: '#6B7280', fontSize: '0.75rem', display: { xs: 'none', lg: 'table-cell' }, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lead.propertyId ? getPropertyTitle(lead.propertyId) : '—'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={statusCfg.label}
                          sx={{
                            height: 22,
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            bgcolor: statusCfg.bg,
                            color: statusCfg.color,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#9CA3AF', fontSize: '0.75rem', display: { xs: 'none', sm: 'table-cell' }, whiteSpace: 'nowrap' }}>
                        {new Date(lead.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Quick Actions */}
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1B2A4A', mb: 2 }}>
          Quick Actions
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Icon icon="mdi:plus" />}
            onClick={() => navigate('/admin/properties/add')}
            sx={{ borderRadius: 2 }}
          >
            Add New Property
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<Icon icon="mdi:account-group-outline" />}
            onClick={() => navigate('/admin/leads')}
            sx={{ borderRadius: 2 }}
          >
            View All Leads
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<Icon icon="mdi:pencil-outline" />}
            onClick={() => navigate('/admin/articles/add')}
            sx={{ borderRadius: 2 }}
          >
            Write Article
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Dashboard;
