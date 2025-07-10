import React, { useState, useEffect } from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { AccessTime as TimeIcon } from '@mui/icons-material';

interface CountdownTimerProps {
  minutes: number;
  onTimeout: () => void;
  title?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  minutes, 
  onTimeout, 
  title = "Tempo restante para pagamento" 
}) => {
  const totalSeconds = minutes * 60;
  const [timeLeft, setTimeLeft] = useState(totalSeconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeout();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          onTimeout();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeout]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  return (
    <Box 
      sx={{ 
        textAlign: 'center', 
        p: 3, 
        bgcolor: 'warning.light', 
        borderRadius: 2, 
        mb: 3,
        border: '2px solid',
        borderColor: 'warning.main'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
        <TimeIcon sx={{ mr: 1, color: 'warning.dark' }} />
        <Typography variant="h6" fontWeight="bold" color="warning.dark">
          {title}
        </Typography>
      </Box>
      
      <Typography variant="h3" fontWeight="bold" color="warning.dark" sx={{ mb: 2 }}>
        {formatTime(timeLeft)}
      </Typography>
      
      <LinearProgress 
        variant="determinate" 
        value={progress} 
        sx={{ 
          height: 8, 
          borderRadius: 4,
          bgcolor: 'warning.light',
          '& .MuiLinearProgress-bar': {
            bgcolor: 'warning.main'
          }
        }} 
      />
      
      <Typography variant="body2" color="warning.dark" sx={{ mt: 1 }}>
        Após este tempo, você será redirecionado para fazer login novamente
      </Typography>
    </Box>
  );
};

export default CountdownTimer; 