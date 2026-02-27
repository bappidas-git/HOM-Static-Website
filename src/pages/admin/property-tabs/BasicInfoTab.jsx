import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormLabel,
  InputAdornment,
  Chip,
} from '@mui/material';
import { Icon } from '@iconify/react';
import { TAG_OPTIONS, PROPERTY_CATEGORIES } from './constants';

const BasicInfoTab = ({ formData, updateField, errors, slugManuallyEdited, setSlugManuallyEdited }) => {
  const toggleTag = (tag) => {
    updateField(
      'tags',
      formData.tags.includes(tag)
        ? formData.tags.filter((t) => t !== tag)
        : [...formData.tags, tag]
    );
  };

  const isRent = formData.type === 'rent';

  // Get categories based on current type selection
  const categories = useMemo(() => {
    return PROPERTY_CATEGORIES[formData.type] || PROPERTY_CATEGORIES.sale;
  }, [formData.type]);

  // When type changes, reset propertyType if not available in new type's categories
  const handleTypeChange = (newType) => {
    updateField('type', newType);
    const availableCategories = PROPERTY_CATEGORIES[newType] || [];
    const currentCategoryValid = availableCategories.some((c) => c.value === formData.propertyType);
    if (!currentCategoryValid && availableCategories.length > 0) {
      updateField('propertyType', availableCategories[0].value);
    }
    // Auto-set price unit for rent
    if (newType === 'rent' && formData.priceUnit === 'onwards') {
      updateField('priceUnit', 'per month');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <TextField
        label="Property Name"
        value={formData.title}
        onChange={(e) => updateField('title', e.target.value)}
        error={!!errors.title}
        helperText={errors.title}
        fullWidth
        required
      />

      <TextField
        label="Slug"
        value={formData.slug}
        onChange={(e) => {
          setSlugManuallyEdited(true);
          updateField('slug', e.target.value);
        }}
        error={!!errors.slug}
        helperText={errors.slug || 'Auto-generated from title. Edit to customize.'}
        fullWidth
        required
        InputProps={{
          startAdornment: <InputAdornment position="start">/properties/</InputAdornment>,
        }}
      />

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        <FormControl>
          <FormLabel sx={{ fontWeight: 600, mb: 1, color: '#1B2A4A' }}>Type</FormLabel>
          <RadioGroup
            row
            value={formData.type}
            onChange={(e) => handleTypeChange(e.target.value)}
          >
            <FormControlLabel value="sale" control={<Radio />} label="Sale" />
            <FormControlLabel value="rent" control={<Radio />} label="Rent" />
          </RadioGroup>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Property Category</InputLabel>
          <Select
            value={formData.propertyType}
            label="Property Category"
            onChange={(e) => updateField('propertyType', e.target.value)}
          >
            {categories.map((cat) => (
              <MenuItem key={cat.value} value={cat.value}>
                {cat.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <FormControl sx={{ maxWidth: 300 }}>
        <InputLabel>Status</InputLabel>
        <Select
          value={formData.status}
          label="Status"
          onChange={(e) => updateField('status', e.target.value)}
        >
          <MenuItem value="pre-launch">Pre-Launch</MenuItem>
          <MenuItem value="under-construction">Under Construction</MenuItem>
          <MenuItem value="ready-to-move">Ready to Move</MenuItem>
        </Select>
      </FormControl>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Price"
          type="number"
          value={formData.price}
          onChange={(e) => updateField('price', e.target.value)}
          error={!!errors.price}
          helperText={errors.price}
          required
          sx={{ flex: 1, minWidth: 200 }}
          InputProps={{
            startAdornment: <InputAdornment position="start">&#8377;</InputAdornment>,
          }}
        />
        <FormControl sx={{ minWidth: 140 }}>
          <InputLabel>Price Unit</InputLabel>
          <Select
            value={formData.priceUnit}
            label="Price Unit"
            onChange={(e) => updateField('priceUnit', e.target.value)}
          >
            <MenuItem value="onwards">Onwards</MenuItem>
            <MenuItem value="per month">Per Month</MenuItem>
            <MenuItem value="Cr">Cr</MenuItem>
            <MenuItem value="Lakhs">Lakhs</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {!isRent && (
        <TextField
          label="Developer Name"
          value={formData.developer}
          onChange={(e) => updateField('developer', e.target.value)}
          error={!!errors.developer}
          helperText={errors.developer}
          fullWidth
          required
        />
      )}

      {isRent && (
        <TextField
          label="Owner / Manager Name"
          value={formData.developer}
          onChange={(e) => updateField('developer', e.target.value)}
          fullWidth
          placeholder="Optional for rent properties"
          helperText="Property owner or manager (optional)"
        />
      )}

      <TextField
        label="Possession Date"
        value={formData.possession}
        onChange={(e) => updateField('possession', e.target.value)}
        fullWidth
        placeholder={isRent ? 'e.g., Immediate or Feb 2026' : 'e.g., Dec 2026 or Ready to Move'}
      />

      {/* Property Tags */}
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1B2A4A', mb: 1 }}>
          Property Tags
        </Typography>
        <Typography variant="caption" sx={{ color: '#9CA3AF', display: 'block', mb: 1.5 }}>
          Toggle tags to control property visibility in featured sections and search filters.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {TAG_OPTIONS.map((tag) => {
            const selected = formData.tags.includes(tag.value);
            return (
              <Chip
                key={tag.value}
                icon={<Icon icon={tag.icon} style={{ fontSize: 16, color: selected ? tag.color : '#9CA3AF' }} />}
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

export default BasicInfoTab;
