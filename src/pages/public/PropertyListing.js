import React from 'react';
import { Box, Typography } from '@mui/material';

const PropertyListing = () => {
  return (
    <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="h2">Property Listings</Typography>
    </Box>
  );
};

export default PropertyListing;
