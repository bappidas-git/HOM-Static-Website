import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  LinearProgress,
  Skeleton,
  useMediaQuery,
  useTheme,
  InputAdornment,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Icon } from '@iconify/react';
import { propertyService } from '../../services/api';

// Calculate SEO score based on completeness
const calculateSeoScore = (property) => {
  let score = 0;
  const total = 4;
  if (property.seoTitle && property.seoTitle.trim()) score++;
  if (property.seoDescription && property.seoDescription.trim()) score++;
  if (property.seoKeywords && property.seoKeywords.length > 0) score++;
  if (property.schemaMarkup && property.schemaMarkup.trim()) score++;
  return Math.round((score / total) * 100);
};

// Generate SEO data from property info
const generateSeoData = (property) => {
  const configs = property.configuration ? property.configuration.join(', ') : '';
  const area = property.location?.area || '';
  const city = property.location?.city || '';
  const developer = property.developer || '';

  const seoTitle = `${property.title} | ${configs} in ${area}, ${city}`;
  const seoDescription = `${property.title} by ${developer} in ${area}, ${city}. ${configs} apartments${
    property.dimensionRange
      ? ` from ${property.dimensionRange.min}-${property.dimensionRange.max} ${property.dimensionRange.unit}`
      : ''
  }. ${property.status === 'ready-to-move' ? 'Ready to move.' : `Possession: ${property.possession}.`}`;
  const seoKeywords = [
    property.title.toLowerCase(),
    `${area.toLowerCase()} apartments`,
    `${developer.toLowerCase()} ${city.toLowerCase()}`,
    `${property.type === 'rent' ? 'rent' : 'buy'} ${city.toLowerCase()}`,
  ];
  const schemaMarkup = JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'Residence',
      name: property.title,
      description: property.description?.slice(0, 200),
      address: {
        '@type': 'PostalAddress',
        addressLocality: area,
        addressRegion: city,
      },
    },
    null,
    2
  );

  return { seoTitle, seoDescription, seoKeywords, schemaMarkup };
};

const SeoScoreBar = ({ score }) => {
  const color = score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 100 }}>
      <LinearProgress
        variant="determinate"
        value={score}
        sx={{
          flex: 1,
          height: 6,
          borderRadius: 3,
          bgcolor: '#F3F4F6',
          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 },
        }}
      />
      <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color, minWidth: 32 }}>
        {score}%
      </Typography>
    </Box>
  );
};

const StatusDot = ({ hasValue, label }) => (
  <Tooltip title={hasValue ? `${label} set` : `${label} missing`} arrow>
    <Box
      sx={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        bgcolor: hasValue ? '#10B981' : '#EF4444',
        display: 'inline-block',
      }}
    />
  </Tooltip>
);

const GooglePreview = ({ title, description, slug }) => (
  <Paper
    variant="outlined"
    sx={{
      p: 2,
      borderRadius: 2,
      bgcolor: '#FAFAFA',
      border: '1px solid #E5E7EB',
    }}
  >
    <Typography sx={{ fontSize: '0.6875rem', color: '#9CA3AF', mb: 0.5 }}>
      Google Search Preview
    </Typography>
    <Typography
      sx={{
        fontSize: '1.125rem',
        color: '#1a0dab',
        fontFamily: 'arial, sans-serif',
        lineHeight: 1.3,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {title || 'Page Title — Site Name'}
    </Typography>
    <Typography
      sx={{
        fontSize: '0.8125rem',
        color: '#006621',
        fontFamily: 'arial, sans-serif',
        mt: 0.25,
      }}
    >
      homadvisory.com/properties/{slug || 'property-slug'}
    </Typography>
    <Typography
      sx={{
        fontSize: '0.8125rem',
        color: '#545454',
        fontFamily: 'arial, sans-serif',
        mt: 0.25,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}
    >
      {description || 'Meta description will appear here. Add a compelling description to improve click-through rates.'}
    </Typography>
  </Paper>
);

const AdminSeo = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editProperty, setEditProperty] = useState(null);
  const [editForm, setEditForm] = useState({
    seoTitle: '',
    seoDescription: '',
    seoKeywords: [],
    schemaMarkup: '',
  });
  const [keywordInput, setKeywordInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [bulkGenerating, setBulkGenerating] = useState(false);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const data = await propertyService.getAll();
      setProperties(Array.isArray(data) ? data : []);
    } catch {
      setSnackbar({ open: true, message: 'Failed to load properties', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const filtered = useMemo(() => {
    if (!search.trim()) return properties;
    const q = search.toLowerCase();
    return properties.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.seoTitle?.toLowerCase().includes(q) ||
        p.location?.area?.toLowerCase().includes(q)
    );
  }, [properties, search]);

  const paginated = useMemo(
    () => filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filtered, page, rowsPerPage]
  );

  const stats = useMemo(() => {
    const total = properties.length;
    const complete = properties.filter((p) => calculateSeoScore(p) === 100).length;
    const partial = properties.filter((p) => {
      const s = calculateSeoScore(p);
      return s > 0 && s < 100;
    }).length;
    const missing = properties.filter((p) => calculateSeoScore(p) === 0).length;
    const avgScore = total > 0 ? Math.round(properties.reduce((acc, p) => acc + calculateSeoScore(p), 0) / total) : 0;
    return { total, complete, partial, missing, avgScore };
  }, [properties]);

  const handleOpenEdit = (property) => {
    setEditProperty(property);
    setEditForm({
      seoTitle: property.seoTitle || '',
      seoDescription: property.seoDescription || '',
      seoKeywords: property.seoKeywords || [],
      schemaMarkup: property.schemaMarkup || '',
    });
    setKeywordInput('');
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editProperty) return;
    setSaving(true);
    try {
      await propertyService.update(editProperty.id, {
        seoTitle: editForm.seoTitle,
        seoDescription: editForm.seoDescription,
        seoKeywords: editForm.seoKeywords,
        schemaMarkup: editForm.schemaMarkup,
      });
      setProperties((prev) =>
        prev.map((p) =>
          p.id === editProperty.id
            ? { ...p, ...editForm }
            : p
        )
      );
      setSnackbar({ open: true, message: 'SEO data saved successfully', severity: 'success' });
      setEditDialogOpen(false);
    } catch {
      setSnackbar({ open: true, message: 'Failed to save SEO data', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleAutoGenerate = () => {
    if (!editProperty) return;
    const generated = generateSeoData(editProperty);
    setEditForm(generated);
  };

  const handleAddKeyword = () => {
    const kw = keywordInput.trim().toLowerCase();
    if (kw && !editForm.seoKeywords.includes(kw)) {
      setEditForm((prev) => ({
        ...prev,
        seoKeywords: [...prev.seoKeywords, kw],
      }));
    }
    setKeywordInput('');
  };

  const handleRemoveKeyword = (kw) => {
    setEditForm((prev) => ({
      ...prev,
      seoKeywords: prev.seoKeywords.filter((k) => k !== kw),
    }));
  };

  const handleBulkAutoGenerate = async () => {
    const incomplete = properties.filter((p) => calculateSeoScore(p) < 100);
    if (incomplete.length === 0) {
      setSnackbar({ open: true, message: 'All properties already have complete SEO data', severity: 'info' });
      return;
    }
    setBulkGenerating(true);
    try {
      const updates = [];
      for (const prop of incomplete) {
        const generated = generateSeoData(prop);
        const merged = {
          seoTitle: prop.seoTitle?.trim() ? prop.seoTitle : generated.seoTitle,
          seoDescription: prop.seoDescription?.trim() ? prop.seoDescription : generated.seoDescription,
          seoKeywords: prop.seoKeywords?.length > 0 ? prop.seoKeywords : generated.seoKeywords,
          schemaMarkup: prop.schemaMarkup?.trim() ? prop.schemaMarkup : generated.schemaMarkup,
        };
        await propertyService.update(prop.id, merged);
        updates.push({ id: prop.id, ...merged });
      }
      setProperties((prev) =>
        prev.map((p) => {
          const u = updates.find((upd) => upd.id === p.id);
          return u ? { ...p, ...u } : p;
        })
      );
      setSnackbar({
        open: true,
        message: `Auto-generated SEO for ${updates.length} properties`,
        severity: 'success',
      });
    } catch {
      setSnackbar({ open: true, message: 'Failed to auto-generate SEO data', severity: 'error' });
    } finally {
      setBulkGenerating(false);
    }
  };

  const statCards = [
    { label: 'Total Properties', value: stats.total, icon: 'mdi:home-city-outline', color: '#3B82F6', bg: '#EFF6FF' },
    { label: 'SEO Complete', value: stats.complete, icon: 'mdi:check-circle-outline', color: '#10B981', bg: '#ECFDF5' },
    { label: 'Partial SEO', value: stats.partial, icon: 'mdi:alert-circle-outline', color: '#F59E0B', bg: '#FFFBEB' },
    { label: 'Avg SEO Score', value: `${stats.avgScore}%`, icon: 'mdi:chart-line', color: '#8B5CF6', bg: '#F5F3FF' },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#1B2A4A' }}>
            SEO Manager
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: '#6B7280', mt: 0.5 }}>
            Manage SEO metadata for all property listings
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Icon icon="mdi:auto-fix" />}
          onClick={handleBulkAutoGenerate}
          disabled={bulkGenerating || loading}
          sx={{
            bgcolor: '#1B2A4A',
            textTransform: 'none',
            borderRadius: 2,
            px: 3,
            '&:hover': { bgcolor: '#2d3f63' },
          }}
        >
          {bulkGenerating ? 'Generating...' : 'Auto-Generate Missing SEO'}
        </Button>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        {statCards.map((stat) => (
          <Paper
            key={stat.label}
            elevation={0}
            sx={{ p: 2.5, borderRadius: 2, border: '1px solid #F3F4F6' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: stat.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon icon={stat.icon} style={{ fontSize: 20, color: stat.color }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#1B2A4A' }}>
                  {loading ? <Skeleton width={40} /> : stat.value}
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{stat.label}</Typography>
              </Box>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Search */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #F3F4F6', mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search properties by name or location..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Icon icon="mdi:magnify" style={{ color: '#9CA3AF' }} />
              </InputAdornment>
            ),
          }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      </Paper>

      {/* Table */}
      <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #F3F4F6', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ p: 3 }}>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} height={56} sx={{ mb: 1 }} />
            ))}
          </Box>
        ) : isMobile ? (
          /* Mobile Card View */
          <Box sx={{ p: 2 }}>
            {paginated.map((property) => {
              const score = calculateSeoScore(property);
              return (
                <Paper
                  key={property.id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: 2,
                    cursor: 'pointer',
                    '&:hover': { borderColor: '#C9A86C' },
                  }}
                  onClick={() => handleOpenEdit(property)}
                >
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1B2A4A', mb: 1 }}>
                    {property.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mb: 1.5, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <StatusDot hasValue={!!property.seoTitle?.trim()} label="Title" />
                      <Typography sx={{ fontSize: '0.75rem', color: '#6B7280' }}>Title</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <StatusDot hasValue={!!property.seoDescription?.trim()} label="Description" />
                      <Typography sx={{ fontSize: '0.75rem', color: '#6B7280' }}>Desc</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <StatusDot hasValue={property.seoKeywords?.length > 0} label="Keywords" />
                      <Typography sx={{ fontSize: '0.75rem', color: '#6B7280' }}>
                        Keywords ({property.seoKeywords?.length || 0})
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <StatusDot hasValue={!!property.schemaMarkup?.trim()} label="Schema" />
                      <Typography sx={{ fontSize: '0.75rem', color: '#6B7280' }}>Schema</Typography>
                    </Box>
                  </Box>
                  <SeoScoreBar score={score} />
                </Paper>
              );
            })}
          </Box>
        ) : (
          /* Desktop Table View */
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#FAFAFA' }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }}>Property</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }}>SEO Title</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }} align="center">Description</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }} align="center">Keywords</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }} align="center">Schema</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }}>SEO Score</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map((property) => {
                  const score = calculateSeoScore(property);
                  return (
                    <TableRow
                      key={property.id}
                      hover
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'rgba(201,168,108,0.04)' } }}
                      onClick={() => handleOpenEdit(property)}
                    >
                      <TableCell>
                        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1B2A4A' }}>
                          {property.title}
                        </Typography>
                        <Typography sx={{ fontSize: '0.6875rem', color: '#9CA3AF' }}>
                          {property.location?.area}, {property.location?.city}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <StatusDot hasValue={!!property.seoTitle?.trim()} label="Title" />
                          <Typography
                            sx={{
                              fontSize: '0.75rem',
                              color: property.seoTitle?.trim() ? '#374151' : '#EF4444',
                              maxWidth: 200,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {property.seoTitle?.trim() || 'Not set'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <StatusDot hasValue={!!property.seoDescription?.trim()} label="Description" />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={property.seoKeywords?.length || 0}
                          size="small"
                          sx={{
                            fontSize: '0.6875rem',
                            height: 22,
                            bgcolor: property.seoKeywords?.length > 0 ? '#ECFDF5' : '#FEF2F2',
                            color: property.seoKeywords?.length > 0 ? '#10B981' : '#EF4444',
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <StatusDot hasValue={!!property.schemaMarkup?.trim()} label="Schema" />
                      </TableCell>
                      <TableCell>
                        <SeoScoreBar score={score} />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); handleOpenEdit(property); }}
                        >
                          <Icon icon="mdi:pencil-outline" style={{ fontSize: 18, color: '#6B7280' }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {paginated.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <Icon icon="mdi:magnify" style={{ fontSize: 40, color: '#D1D5DB' }} />
                      <Typography sx={{ color: '#9CA3AF', mt: 1 }}>No properties found</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25]}
          sx={{ borderTop: '1px solid #F3F4F6' }}
        />
      </Paper>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #F3F4F6',
            pb: 2,
          }}
        >
          <Box>
            <Typography sx={{ fontSize: '1.125rem', fontWeight: 700, color: '#1B2A4A' }}>
              Edit SEO — {editProperty?.title}
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: '#9CA3AF', mt: 0.25 }}>
              {editProperty?.location?.area}, {editProperty?.location?.city}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              startIcon={<Icon icon="mdi:auto-fix" />}
              onClick={handleAutoGenerate}
              sx={{ textTransform: 'none', fontSize: '0.75rem' }}
            >
              Auto-Generate
            </Button>
            <IconButton size="small" onClick={() => setEditDialogOpen(false)}>
              <Icon icon="mdi:close" />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          {/* Google Preview */}
          <Box sx={{ mb: 3 }}>
            <GooglePreview
              title={editForm.seoTitle}
              description={editForm.seoDescription}
              slug={editProperty?.slug}
            />
          </Box>

          {/* SEO Title */}
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', mb: 1 }}>
              SEO Title
              <Typography component="span" sx={{ fontSize: '0.6875rem', color: '#9CA3AF', ml: 1 }}>
                {editForm.seoTitle.length}/70 characters
              </Typography>
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={editForm.seoTitle}
              onChange={(e) => setEditForm((prev) => ({ ...prev, seoTitle: e.target.value }))}
              placeholder="Enter SEO title for this property..."
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Box>

          {/* SEO Description */}
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', mb: 1 }}>
              SEO Description
              <Typography component="span" sx={{ fontSize: '0.6875rem', color: '#9CA3AF', ml: 1 }}>
                {editForm.seoDescription.length}/160 characters
              </Typography>
            </Typography>
            <TextField
              fullWidth
              size="small"
              multiline
              rows={3}
              value={editForm.seoDescription}
              onChange={(e) => setEditForm((prev) => ({ ...prev, seoDescription: e.target.value }))}
              placeholder="Enter SEO description..."
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Box>

          {/* Keywords */}
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', mb: 1 }}>
              Keywords ({editForm.seoKeywords.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
              <TextField
                size="small"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="Add a keyword..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddKeyword();
                  }
                }}
                sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <Button
                variant="outlined"
                onClick={handleAddKeyword}
                sx={{ textTransform: 'none', borderRadius: 2, borderColor: '#D1D5DB', color: '#374151' }}
              >
                Add
              </Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
              {editForm.seoKeywords.map((kw) => (
                <Chip
                  key={kw}
                  label={kw}
                  size="small"
                  onDelete={() => handleRemoveKeyword(kw)}
                  sx={{
                    fontSize: '0.75rem',
                    bgcolor: '#F3F4F6',
                    '& .MuiChip-deleteIcon': { fontSize: 16 },
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Schema Markup */}
          <Box>
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', mb: 1 }}>
              Schema Markup (JSON-LD)
            </Typography>
            <TextField
              fullWidth
              size="small"
              multiline
              rows={8}
              value={editForm.schemaMarkup}
              onChange={(e) => setEditForm((prev) => ({ ...prev, schemaMarkup: e.target.value }))}
              placeholder='{"@context":"https://schema.org","@type":"Residence",...}'
              InputProps={{
                sx: { fontFamily: 'monospace', fontSize: '0.8125rem' },
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #F3F4F6' }}>
          <Button
            onClick={() => setEditDialogOpen(false)}
            sx={{ textTransform: 'none', color: '#6B7280' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{
              textTransform: 'none',
              bgcolor: '#1B2A4A',
              borderRadius: 2,
              px: 4,
              '&:hover': { bgcolor: '#2d3f63' },
            }}
          >
            {saving ? 'Saving...' : 'Save SEO Data'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminSeo;
