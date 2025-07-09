import React from 'react';
import { Typography, Box, Divider } from '@mui/material';

interface PageHeaderProps {
  title: string;
  description: string;
  actionComponent?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actionComponent }) => {
  return (
    <Box mb={4}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1">
            {title}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
            {description}
          </Typography>
        </Box>
        {actionComponent && <Box>{actionComponent}</Box>}
      </Box>
      <Divider sx={{ mt: 2 }} />
    </Box>
  );
};

export default PageHeader; 