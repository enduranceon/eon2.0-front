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
  gradient?: boolean;
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
  gradient = false,
}: StatsCardProps) {
  const theme = useTheme();

  const getColorScheme = () => {
    switch (color) {
      case 'primary':
        return {
          main: theme.palette.primary.main,
          light: theme.palette.primary.light,
          gradient: theme.colors.gradient.primary,
        };
      case 'secondary':
        return {
          main: theme.palette.secondary.main,
          light: theme.palette.secondary.light,
          gradient: theme.colors.gradient.secondary,
        };
      case 'success':
        return {
          main: theme.palette.success.main,
          light: theme.palette.success.light,
          gradient: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)',
        };
      case 'error':
        return {
          main: theme.palette.error.main,
          light: theme.palette.error.light,
          gradient: 'linear-gradient(135deg, #f44336 0%, #e57373 100%)',
        };
      case 'warning':
        return {
          main: theme.palette.warning.main,
          light: theme.palette.warning.light,
          gradient: theme.colors.gradient.accent,
        };
      case 'info':
        return {
          main: theme.palette.info.main,
          light: theme.palette.info.light,
          gradient: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)',
        };
      default:
        return {
          main: theme.palette.primary.main,
          light: theme.palette.primary.light,
          gradient: theme.colors.gradient.primary,
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
    if (!change) return theme.colors.text.secondary;
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
        background: gradient ? colorScheme.gradient : theme.colors.background.paper,
        color: gradient ? 'white' : 'inherit',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.colors.shadow.elevated,
        },
        '&::before': gradient ? {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
          zIndex: 0,
        } : undefined,
      }}
    >
      <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              background: gradient 
                ? 'rgba(255, 255, 255, 0.2)' 
                : `${colorScheme.main}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: gradient ? 'white' : colorScheme.main,
              fontSize: 24,
              backdropFilter: 'blur(10px)',
            }}
          >
            {icon}
          </Box>
          <Box sx={{ ml: 'auto' }}>
            {action || (
              <IconButton
                size="small"
                sx={{
                  color: gradient ? 'rgba(255, 255, 255, 0.7)' : theme.colors.text.secondary,
                  '&:hover': {
                    backgroundColor: gradient 
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : theme.colors.surface.tertiary,
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
            color: gradient ? 'rgba(255, 255, 255, 0.9)' : theme.colors.text.secondary,
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
            color: gradient ? 'white' : theme.colors.text.primary,
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
              color: gradient ? 'rgba(255, 255, 255, 0.8)' : theme.colors.text.secondary,
              mb: 1,
              display: 'block',
            }}
          >
            {subtitle}
          </Typography>
        )}

        {/* Change Indicator */}
        {change !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 'auto' }}>
            <Chip
              icon={getChangeIcon()}
              label={`${change > 0 ? '+' : ''}${change}%`}
              size="small"
              sx={{
                height: 24,
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: gradient 
                  ? 'rgba(255, 255, 255, 0.2)' 
                  : `${getChangeColor()}15`,
                color: gradient ? 'white' : getChangeColor(),
                borderRadius: '8px',
                '& .MuiChip-icon': {
                  color: gradient ? 'white' : getChangeColor(),
                  fontSize: 16,
                },
              }}
            />
            {changeLabel && (
              <Typography
                variant="caption"
                sx={{
                  ml: 1,
                  color: gradient ? 'rgba(255, 255, 255, 0.7)' : theme.colors.text.secondary,
                }}
              >
                {changeLabel}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>

      {/* Decorative Elements */}
      <Box
        sx={{
          position: 'absolute',
          bottom: -20,
          right: -20,
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: gradient 
            ? 'rgba(255, 255, 255, 0.1)' 
            : `${colorScheme.main}10`,
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: -10,
          right: -10,
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: gradient 
            ? 'rgba(255, 255, 255, 0.05)' 
            : `${colorScheme.main}08`,
          zIndex: 0,
        }}
      />
    </Card>
  );
} 