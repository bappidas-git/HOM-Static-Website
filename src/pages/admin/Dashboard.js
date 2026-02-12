import React from 'react';
import { Box, Typography } from '@mui/material';

const Dashboard = () => {
  return (
    <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="h2">Admin Dashboard</Typography>
    </Box>
  );
};

export default Dashboard;
