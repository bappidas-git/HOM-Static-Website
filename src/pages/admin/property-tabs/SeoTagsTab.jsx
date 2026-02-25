import React, { useState } from 'react';
import { Box, Typography, TextField, Chip, InputAdornment, Paper } from '@mui/material';
import { Icon } from '@iconify/react';
import { TAG_OPTIONS } from './constants';

const SeoTagsTab = ({ formData, updateField }) => {
  const [keywordInput, setKeywordInput] = useState('');

  const addKeyword = (keyword) => {
    const trimmed = keyword.trim().toLowerCase();
    if (trimmed && !formData.seoKeywords.includes(trimmed)) {
      updateField('seoKeywords', [...formData.seoKeywords, trimmed]);
    }
    setKeywordInput('');
  };

  const removeKeyword = (keyword) => {
    updateField('seoKeywords', formData.seoKeywords.filter((k) => k !== keyword));
  };

  const toggleTag = (tag) => {
    updateField(
      'tags',
      formData.tags.includes(tag)
        ? formData.tags.filter((t) => t !== tag)
        : [...formData.tags, tag]
    );
  };

  const validateSchema = (value) => {
    if (!value.trim()) return true;
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Basic SEO */}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1B2A4A' }}>
        SEO Settings
      </Typography>

      <TextField
        label="SEO Title"
        value={formData.seoTitle}
        onChange={(e) => {
          if (e.target.value.length <= 70) updateField('seoTitle', e.target.value);
        }}
        fullWidth
        helperText={`${formData.seoTitle.length}/70 characters`}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Typography
                variant="caption"
                sx={{ color: formData.seoTitle.length > 60 ? '#EF4444' : '#9CA3AF' }}
              >
                {70 - formData.seoTitle.length}
              </Typography>
            </InputAdornment>
          ),
        }}
      />

      <TextField
        label="SEO Description"
        value={formData.seoDescription}
        onChange={(e) => {
          if (e.target.value.length <= 160) updateField('seoDescription', e.target.value);
        }}
        multiline
        rows={3}
        fullWidth
        helperText={`${formData.seoDescription.length}/160 characters`}
      />

      {/* SEO Keywords */}
      <Box>
        <TextField
          label="SEO Keywords"
          size="small"
          value={keywordInput}
          onChange={(e) => setKeywordInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addKeyword(keywordInput);
            }
          }}
          fullWidth
          placeholder="Type a keyword and press Enter"
          helperText="Press Enter to add"
        />
        {formData.seoKeywords.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
            {formData.seoKeywords.map((kw) => (
              <Chip key={kw} label={kw} size="small" onDelete={() => removeKeyword(kw)} sx={{ bgcolor: '#F3F4F6' }} />
            ))}
          </Box>
        )}
      </Box>

      <TextField
        label="Canonical URL"
        value={formData.canonicalUrl || ''}
        onChange={(e) => updateField('canonicalUrl', e.target.value)}
        fullWidth
        size="small"
        placeholder="https://example.com/properties/property-slug"
        helperText="Optional. If empty, current URL is used."
      />

      {/* Open Graph */}
      <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #E5E7EB' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Icon icon="mdi:share-variant" style={{ fontSize: 20, color: '#C9A86C' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1B2A4A' }}>
            Open Graph Tags
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="OG Title"
            size="small"
            value={formData.ogTitle || ''}
            onChange={(e) => updateField('ogTitle', e.target.value)}
            fullWidth
            placeholder="Defaults to SEO Title if empty"
          />
          <TextField
            label="OG Description"
            size="small"
            value={formData.ogDescription || ''}
            onChange={(e) => updateField('ogDescription', e.target.value)}
            fullWidth
            multiline
            rows={2}
            placeholder="Defaults to SEO Description if empty"
          />
          <TextField
            label="OG Image URL"
            size="small"
            value={formData.ogImage || ''}
            onChange={(e) => updateField('ogImage', e.target.value)}
            fullWidth
            placeholder="Defaults to first gallery image if empty"
          />
        </Box>
      </Paper>

      {/* Twitter Card */}
      <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #E5E7EB' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Icon icon="mdi:twitter" style={{ fontSize: 20, color: '#C9A86C' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1B2A4A' }}>
            Twitter Card
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {['summary', 'summary_large_image'].map((type) => (
            <Chip
              key={type}
              label={type}
              clickable
              onClick={() => updateField('twitterCard', type)}
              sx={{
                fontWeight: 500,
                bgcolor: formData.twitterCard === type ? '#1B2A4A' : '#F3F4F6',
                color: formData.twitterCard === type ? '#fff' : '#6B7280',
              }}
            />
          ))}
        </Box>
      </Paper>

      {/* Schema Markup */}
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1B2A4A', mb: 1 }}>
          JSON-LD Schema Markup
        </Typography>
        <TextField
          value={formData.schemaMarkup}
          onChange={(e) => updateField('schemaMarkup', e.target.value)}
          multiline
          rows={6}
          fullWidth
          error={formData.schemaMarkup && !validateSchema(formData.schemaMarkup)}
          helperText={
            formData.schemaMarkup && !validateSchema(formData.schemaMarkup)
              ? 'Invalid JSON format (will still be saved)'
              : 'Paste valid JSON-LD schema markup'
          }
          InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.8125rem' } }}
        />
      </Box>

      {/* Property Tags */}
      <Box sx={{ mt: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1B2A4A', mb: 1.5 }}>
          Property Tags
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {TAG_OPTIONS.map((tag) => {
            const selected = formData.tags.includes(tag.value);
            return (
              <Chip
                key={tag.value}
                label={tag.label}
                clickable
                onClick={() => toggleTag(tag.value)}
                sx={{
                  fontWeight: 600,
                  bgcolor: selected ? tag.bg : '#F3F4F6',
                  color: selected ? tag.color : '#9CA3AF',
                  border: selected ? `1px solid ${tag.color}` : '1px solid transparent',
                  '&:hover': { opacity: 0.85 },
                }}
              />
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

export default SeoTagsTab;
