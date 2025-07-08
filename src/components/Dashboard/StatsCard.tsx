'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  useTheme,
  Skeleton,
  Chip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  loading?: boolean;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function StatsCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  color = 'primary',
  loading = false,
  subtitle,
  action,
}: StatsCardProps) {
  const theme = useTheme();

  const getColorScheme = () => {
    switch (color) {
      case 'primary':
        return {
          main: theme.palette.primary.main,
          light: theme.palette.primary.light,
        };
      case 'secondary':
        return {
          main: theme.palette.secondary.main,
          light: theme.palette.secondary.light,
        };
      case 'success':
        return {
          main: theme.palette.success.main,
          light: theme.palette.success.light,
        };
      case 'error':
        return {
          main: theme.palette.error.main,
          light: theme.palette.error.light,
        };
      case 'warning':
        return {
          main: theme.palette.warning.main,
          light: theme.palette.warning.light,
        };
      case 'info':
        return {
          main: theme.palette.info.main,
          light: theme.palette.info.light,
        };
      default:
        return {
          main: theme.palette.primary.main,
          light: theme.palette.primary.light,
        };
    }
  };

  const colorScheme = getColorScheme();

  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  const getChangeColor = () => {
    if (!change) return theme.palette.text.secondary;
    return change > 0 ? theme.palette.success.main : theme.palette.error.main;
  };

  const getChangeIcon = () => {
    if (!change) return undefined;
    return change > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />;
  };

  if (loading) {
    return (
      <Card
        sx={{
          height: '100%',
          minHeight: 140,
          transition: 'all 0.3s ease-in-out',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Skeleton variant="circular" width={48} height={48} />
            <Box sx={{ ml: 'auto' }}>
              <Skeleton variant="circular" width={24} height={24} />
            </Box>
          </Box>
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="80%" height={48} />
          <Skeleton variant="text" width="40%" height={20} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        height: '100%',
        minHeight: 140,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease-in-out',
        background: theme.palette.background.paper,
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 8,
              background: `${colorScheme.main}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colorScheme.main,
              fontSize: 24,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ ml: 'auto' }}>
            {action || (
              <IconButton
                size="small"
                sx={{
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              >
                <MoreVertIcon />
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Title */}
        <Typography
          variant="body2"
          sx={{
            mb: 1,
            fontWeight: 500,
            color: theme.palette.text.secondary,
          }}
        >
          {title}
        </Typography>

        {/* Value */}
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 1,
            color: theme.palette.text.primary,
            lineHeight: 1.2,
          }}
        >
          {formatValue(value)}
        </Typography>

        {/* Subtitle */}
        {subtitle && (
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              mb: 1,
              display: 'block',
            }}
          >
            {subtitle}
          </Typography>
        )}

        {/* Change Indicator */}
        {change !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', color: getChangeColor() }}>
            {getChangeIcon()}
            <Typography variant="caption" sx={{ ml: 0.5, fontWeight: 'bold' }}>
              {Math.abs(change)}% {changeLabel || (change > 0 ? 'de aumento' : 'de queda')}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
} 