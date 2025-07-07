import React from 'react';
import { Typography, Box, Divider } from '@mui/material';

interface PageHeaderProps {
  title: string;
  description: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description }) => {
  return (
    <Box mb={4}>
      <Typography variant="h4" component="h1" fontWeight="bold">
        {title}
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
        {description}
      </Typography>
      <Divider sx={{ mt: 2 }} />
    </Box>
  );
};

export default PageHeader; 