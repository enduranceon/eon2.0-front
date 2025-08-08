'use client';

import React, { useState, useEffect } from 'react';
import { VideoCameraIcon, ChartBarIcon, ClockIcon, CheckCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { UserType, VideoCallStats } from '@/types/api';
import VideoCallList from '@/components/Dashboard/VideoCallList';
import { videoCallService } from '@/services/videoCallService';

export default function AdminVideoChamadasPage() {
  const { user } = useAuth();
  
  const [stats, setStats] = useState<VideoCallStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Carregar estatísticas
      try {
        const statsData = await videoCallService.getVideoCallStats();
        setStats(statsData);
      } catch (error) {
      }
    } catch (error: any) {
      setError('Erro ao carregar dados');
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <VideoCameraIcon className="h-8 w-8 text-blue-600" />
            Videochamadas - Administração
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie todas as videochamadas do sistema
          </p>
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <VideoCameraIcon className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Solicitadas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.requested}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Agendadas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.scheduled}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Concluídas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <TrashIcon className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Canceladas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <VideoCameraIcon className="h-8 w-8 text-gray-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Negadas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.denied}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Métricas adicionais */}
      {stats && (stats.averageResponseTime || stats.averageDuration) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {stats.averageResponseTime && (
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <ClockIcon className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Tempo Médio de Resposta</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(stats.averageResponseTime)} min
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {stats.averageDuration && (
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <VideoCameraIcon className="h-8 w-8 text-indigo-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Duração Média</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(stats.averageDuration)} min
                  </p>
                </div>
              </div>
            </div>
          )}

          {stats.monthlyUsage && stats.monthlyUsage.length > 0 && (
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <ChartBarIcon className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Uso Mensal</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.monthlyUsage[stats.monthlyUsage.length - 1]?.count || 0}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gráfico de uso mensal */}
      {stats?.monthlyUsage && stats.monthlyUsage.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Uso Mensal</h3>
          <div className="flex items-end gap-2 h-32">
            {stats.monthlyUsage.slice(-6).map((month, index) => {
              const maxCount = Math.max(...stats.monthlyUsage.map(m => m.count));
              const height = maxCount > 0 ? (month.count / maxCount) * 100 : 0;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-blue-600 rounded-t transition-all duration-300"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-xs text-gray-500 mt-2">
                    {new Date(month.month).toLocaleDateString('pt-BR', { month: 'short' })}
                  </span>
                  <span className="text-xs font-medium text-gray-700">
                    {month.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lista de Videochamadas */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Todas as Videochamadas</h2>
        </div>
        <div className="p-6">
          {user && (
            <VideoCallList
              userType={UserType.ADMIN}
              currentUser={user}
              onRefresh={loadInitialData}
            />
          )}
        </div>
      </div>
    </div>
  );
} 