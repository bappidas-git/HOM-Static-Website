import React from 'react';
import { Typography } from '@mui/material';
import { Icon } from '@iconify/react';

const ImageUrlHelperText = () => (
  <Typography
    variant="caption"
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 0.5,
      color: '#9CA3AF',
      fontSize: '0.65rem',
      mt: 0.25,
    }}
  >
    <Icon icon="mdi:information-outline" style={{ fontSize: 12 }} />
    Recommended: 1200px × 800px | Aspect Ratio: 3:2
  </Typography>
);

export default ImageUrlHelperText;
