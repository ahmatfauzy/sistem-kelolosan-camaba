import type React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  className
}: StatsCardProps) {
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend && (
              <div
                className={cn(
                  'flex items-center text-xs',
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                <span>{trend.isPositive ? '↗' : '↘'}</span>
                <span className="ml-1">{Math.abs(trend.value)}%</span>
              </div>
            )}
          </div>
          {icon && <div className="text-muted-foreground/60">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
