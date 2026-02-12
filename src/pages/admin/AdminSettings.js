import React from 'react';
import { Box, Typography } from '@mui/material';

const AdminSettings = () => {
  return (
    <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="h2">Site Settings</Typography>
    </Box>
  );
};

export default AdminSettings;
