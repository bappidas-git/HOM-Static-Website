import React from 'react';
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
} from '@mui/material';

const BasicInfoTab = ({ formData, updateField, errors, slugManuallyEdited, setSlugManuallyEdited }) => {
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
            onChange={(e) => updateField('type', e.target.value)}
          >
            <FormControlLabel value="sale" control={<Radio />} label="Sale" />
            <FormControlLabel value="rent" control={<Radio />} label="Rent" />
          </RadioGroup>
        </FormControl>

        <FormControl>
          <FormLabel sx={{ fontWeight: 600, mb: 1, color: '#1B2A4A' }}>Property Type</FormLabel>
          <RadioGroup
            row
            value={formData.propertyType}
            onChange={(e) => updateField('propertyType', e.target.value)}
          >
            <FormControlLabel value="apartment" control={<Radio />} label="Apartment" />
            <FormControlLabel value="villa" control={<Radio />} label="Villa" />
            <FormControlLabel value="plot" control={<Radio />} label="Plot" />
          </RadioGroup>
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

      <TextField
        label="Developer Name"
        value={formData.developer}
        onChange={(e) => updateField('developer', e.target.value)}
        error={!!errors.developer}
        helperText={errors.developer}
        fullWidth
        required
      />

      <TextField
        label="Possession Date"
        value={formData.possession}
        onChange={(e) => updateField('possession', e.target.value)}
        fullWidth
        placeholder="e.g., Dec 2026 or Ready to Move"
      />
    </Box>
  );
};

export default BasicInfoTab;
