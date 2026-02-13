import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  Skeleton,
  Divider,
} from '@mui/material';
import { Icon } from '@iconify/react';
import { siteSettingsService } from '../../services/api';

const TabPanel = ({ children, value, index }) => (
  <Box role="tabpanel" hidden={value !== index} sx={{ pt: 3 }}>
    {value === index && children}
  </Box>
);

const FieldGroup = ({ label, children }) => (
  <Box sx={{ mb: 2.5 }}>
    <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', mb: 0.75 }}>
      {label}
    </Typography>
    {children}
  </Box>
);

const AdminSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [hasChanges, setHasChanges] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await siteSettingsService.get();
      setSettings(data);
    } catch {
      setSnackbar({ open: true, message: 'Failed to load settings', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateField = (path, value) => {
    setSettings((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {};
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return updated;
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await siteSettingsService.update(settings);
      setSnackbar({ open: true, message: 'Settings saved successfully', severity: 'success' });
      setHasChanges(false);
    } catch {
      setSnackbar({ open: true, message: 'Failed to save settings', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Skeleton height={40} width={200} sx={{ mb: 3 }} />
        <Skeleton height={48} sx={{ mb: 2 }} />
        <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid #F3F4F6' }}>
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} height={56} sx={{ mb: 2 }} />
          ))}
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 900, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#1B2A4A' }}>
            Site Settings
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: '#6B7280', mt: 0.5 }}>
            Manage global website configuration
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Icon icon="mdi:content-save-outline" />}
          onClick={handleSave}
          disabled={saving || !hasChanges}
          sx={{
            bgcolor: '#1B2A4A',
            textTransform: 'none',
            borderRadius: 2,
            px: 4,
            '&:hover': { bgcolor: '#2d3f63' },
            '&.Mui-disabled': { bgcolor: '#E5E7EB', color: '#9CA3AF' },
          }}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>

      {/* Tabs */}
      <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #F3F4F6', overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: '1px solid #F3F4F6',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
              color: '#6B7280',
              minHeight: 48,
            },
            '& .Mui-selected': { color: '#1B2A4A', fontWeight: 600 },
            '& .MuiTabs-indicator': { bgcolor: '#C9A86C' },
          }}
        >
          <Tab icon={<Icon icon="mdi:domain" style={{ fontSize: 18 }} />} iconPosition="start" label="General" />
          <Tab icon={<Icon icon="mdi:image-outline" style={{ fontSize: 18 }} />} iconPosition="start" label="Hero Section" />
          <Tab icon={<Icon icon="mdi:share-variant-outline" style={{ fontSize: 18 }} />} iconPosition="start" label="Social Links" />
          <Tab icon={<Icon icon="mdi:email-newsletter" style={{ fontSize: 18 }} />} iconPosition="start" label="Newsletter" />
          <Tab icon={<Icon icon="mdi:page-layout-footer" style={{ fontSize: 18 }} />} iconPosition="start" label="Footer" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* General Tab */}
          <TabPanel value={activeTab} index={0}>
            <FieldGroup label="Company Name">
              <TextField
                fullWidth
                size="small"
                value={settings?.companyName || ''}
                onChange={(e) => updateField('companyName', e.target.value)}
                placeholder="Company name..."
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </FieldGroup>

            <FieldGroup label="Tagline">
              <TextField
                fullWidth
                size="small"
                value={settings?.tagline || ''}
                onChange={(e) => updateField('tagline', e.target.value)}
                placeholder="Company tagline..."
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </FieldGroup>

            <FieldGroup label="Company Subtitle">
              <TextField
                fullWidth
                size="small"
                value={settings?.companySubtitle || ''}
                onChange={(e) => updateField('companySubtitle', e.target.value)}
                placeholder="Company subtitle..."
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </FieldGroup>

            <Divider sx={{ my: 3 }} />

            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1B2A4A', mb: 2 }}>
              Contact Information
            </Typography>

            <FieldGroup label="Contact Email">
              <TextField
                fullWidth
                size="small"
                type="email"
                value={settings?.contactInfo?.email || ''}
                onChange={(e) => updateField('contactInfo.email', e.target.value)}
                placeholder="info@company.com"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </FieldGroup>

            <FieldGroup label="Contact Phone">
              <TextField
                fullWidth
                size="small"
                value={settings?.contactInfo?.phone || ''}
                onChange={(e) => updateField('contactInfo.phone', e.target.value)}
                placeholder="(555) 123-4567"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </FieldGroup>

            <FieldGroup label="Address">
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                value={settings?.contactInfo?.address || ''}
                onChange={(e) => updateField('contactInfo.address', e.target.value)}
                placeholder="Full business address..."
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </FieldGroup>
          </TabPanel>

          {/* Hero Section Tab */}
          <TabPanel value={activeTab} index={1}>
            <FieldGroup label="Hero Title">
              <TextField
                fullWidth
                size="small"
                value={settings?.heroText?.title || ''}
                onChange={(e) => updateField('heroText.title', e.target.value)}
                placeholder="Main hero heading text..."
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </FieldGroup>

            <FieldGroup label="Hero Subtitle">
              <TextField
                fullWidth
                size="small"
                value={settings?.heroText?.subtitle || ''}
                onChange={(e) => updateField('heroText.subtitle', e.target.value)}
                placeholder="Hero subtitle text..."
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </FieldGroup>

            <FieldGroup label="Hero Background Image URL">
              <TextField
                fullWidth
                size="small"
                value={settings?.heroText?.backgroundImage || ''}
                onChange={(e) => updateField('heroText.backgroundImage', e.target.value)}
                placeholder="https://example.com/hero-bg.jpg"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </FieldGroup>

            {/* Preview */}
            <Paper
              variant="outlined"
              sx={{
                mt: 3,
                p: 4,
                borderRadius: 2,
                bgcolor: '#1B2A4A',
                textAlign: 'center',
                backgroundImage: settings?.heroText?.backgroundImage
                  ? `linear-gradient(rgba(27,42,74,0.7), rgba(27,42,74,0.85)), url(${settings.heroText.backgroundImage})`
                  : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <Typography sx={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.5)', mb: 1 }}>
                Hero Preview
              </Typography>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', mb: 0.5 }}>
                {settings?.heroText?.title || 'Hero Title'}
              </Typography>
              <Typography sx={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
                {settings?.heroText?.subtitle || 'Hero subtitle text'}
              </Typography>
            </Paper>
          </TabPanel>

          {/* Social Links Tab */}
          <TabPanel value={activeTab} index={2}>
            <FieldGroup label="Instagram URL">
              <TextField
                fullWidth
                size="small"
                value={settings?.socialLinks?.instagram || ''}
                onChange={(e) => updateField('socialLinks.instagram', e.target.value)}
                placeholder="https://instagram.com/..."
                InputProps={{
                  startAdornment: (
                    <Box sx={{ mr: 1, display: 'flex' }}>
                      <Icon icon="mdi:instagram" style={{ fontSize: 20, color: '#E4405F' }} />
                    </Box>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </FieldGroup>

            <FieldGroup label="Facebook URL">
              <TextField
                fullWidth
                size="small"
                value={settings?.socialLinks?.facebook || ''}
                onChange={(e) => updateField('socialLinks.facebook', e.target.value)}
                placeholder="https://facebook.com/..."
                InputProps={{
                  startAdornment: (
                    <Box sx={{ mr: 1, display: 'flex' }}>
                      <Icon icon="mdi:facebook" style={{ fontSize: 20, color: '#1877F2' }} />
                    </Box>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </FieldGroup>

            <FieldGroup label="Twitter URL">
              <TextField
                fullWidth
                size="small"
                value={settings?.socialLinks?.twitter || ''}
                onChange={(e) => updateField('socialLinks.twitter', e.target.value)}
                placeholder="https://twitter.com/..."
                InputProps={{
                  startAdornment: (
                    <Box sx={{ mr: 1, display: 'flex' }}>
                      <Icon icon="mdi:twitter" style={{ fontSize: 20, color: '#1DA1F2' }} />
                    </Box>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </FieldGroup>

            <FieldGroup label="LinkedIn URL">
              <TextField
                fullWidth
                size="small"
                value={settings?.socialLinks?.linkedin || ''}
                onChange={(e) => updateField('socialLinks.linkedin', e.target.value)}
                placeholder="https://linkedin.com/company/..."
                InputProps={{
                  startAdornment: (
                    <Box sx={{ mr: 1, display: 'flex' }}>
                      <Icon icon="mdi:linkedin" style={{ fontSize: 20, color: '#0A66C2' }} />
                    </Box>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </FieldGroup>

            <FieldGroup label="YouTube URL">
              <TextField
                fullWidth
                size="small"
                value={settings?.socialLinks?.youtube || ''}
                onChange={(e) => updateField('socialLinks.youtube', e.target.value)}
                placeholder="https://youtube.com/..."
                InputProps={{
                  startAdornment: (
                    <Box sx={{ mr: 1, display: 'flex' }}>
                      <Icon icon="mdi:youtube" style={{ fontSize: 20, color: '#FF0000' }} />
                    </Box>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </FieldGroup>
          </TabPanel>

          {/* Newsletter Tab */}
          <TabPanel value={activeTab} index={3}>
            <FieldGroup label="Newsletter Heading">
              <TextField
                fullWidth
                size="small"
                value={settings?.newsletterText || ''}
                onChange={(e) => updateField('newsletterText', e.target.value)}
                placeholder="Newsletter heading text..."
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </FieldGroup>

            <FieldGroup label="Newsletter Subtitle">
              <TextField
                fullWidth
                size="small"
                value={settings?.newsletterSubtitle || ''}
                onChange={(e) => updateField('newsletterSubtitle', e.target.value)}
                placeholder="Newsletter subtitle text..."
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </FieldGroup>

            {/* Preview */}
            <Paper
              variant="outlined"
              sx={{ mt: 3, p: 3, borderRadius: 2, bgcolor: '#FAFAFA', textAlign: 'center' }}
            >
              <Typography sx={{ fontSize: '0.6875rem', color: '#9CA3AF', mb: 1 }}>
                Newsletter Section Preview
              </Typography>
              <Typography sx={{ fontSize: '1.125rem', fontWeight: 600, color: '#1B2A4A', mb: 0.5 }}>
                {settings?.newsletterText || 'Newsletter Heading'}
              </Typography>
              <Typography sx={{ fontSize: '0.8125rem', color: '#6B7280' }}>
                {settings?.newsletterSubtitle || 'Subscribe to stay updated'}
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center', maxWidth: 400, mx: 'auto' }}>
                <Box
                  sx={{
                    flex: 1,
                    height: 36,
                    borderRadius: 2,
                    border: '1px solid #D1D5DB',
                    bgcolor: '#fff',
                  }}
                />
                <Box
                  sx={{
                    width: 90,
                    height: 36,
                    borderRadius: 2,
                    bgcolor: '#C9A86C',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography sx={{ fontSize: '0.75rem', color: '#fff', fontWeight: 600 }}>Subscribe</Typography>
                </Box>
              </Box>
            </Paper>
          </TabPanel>

          {/* Footer Tab */}
          <TabPanel value={activeTab} index={4}>
            <FieldGroup label="Footer Description">
              <TextField
                fullWidth
                size="small"
                multiline
                rows={3}
                value={settings?.companyDescription || ''}
                onChange={(e) => updateField('companyDescription', e.target.value)}
                placeholder="Company description for footer..."
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </FieldGroup>

            <FieldGroup label="Footer Tagline">
              <TextField
                fullWidth
                size="small"
                value={settings?.tagline || ''}
                onChange={(e) => updateField('tagline', e.target.value)}
                placeholder="Footer tagline text..."
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </FieldGroup>

            {/* Preview */}
            <Paper
              variant="outlined"
              sx={{
                mt: 3,
                p: 3,
                borderRadius: 2,
                bgcolor: '#1B2A4A',
              }}
            >
              <Typography sx={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.5)', mb: 1 }}>
                Footer Preview
              </Typography>
              <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#C9A86C', mb: 0.5 }}>
                {settings?.companyName || 'Company Name'}
              </Typography>
              <Typography sx={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.5)', mb: 1.5, letterSpacing: 1 }}>
                {settings?.tagline || 'TAGLINE'}
              </Typography>
              <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.7)', maxWidth: 300 }}>
                {settings?.companyDescription || 'Company description text goes here'}
              </Typography>
            </Paper>
          </TabPanel>
        </Box>
      </Paper>

      {/* Floating Save Button (if changes exist) */}
      {hasChanges && (
        <Paper
          elevation={4}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            p: 2,
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            bgcolor: '#fff',
            border: '1px solid #F3F4F6',
            zIndex: 100,
          }}
        >
          <Typography sx={{ fontSize: '0.8125rem', color: '#6B7280' }}>
            Unsaved changes
          </Typography>
          <Button
            variant="contained"
            size="small"
            onClick={handleSave}
            disabled={saving}
            sx={{
              bgcolor: '#1B2A4A',
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': { bgcolor: '#2d3f63' },
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </Paper>
      )}

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

export default AdminSettings;
