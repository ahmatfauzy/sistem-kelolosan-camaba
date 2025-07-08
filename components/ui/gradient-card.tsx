import type React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface GradientCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  gradient?: 'blue' | 'purple' | 'green' | 'orange';
}

export function GradientCard({
  title,
  children,
  className,
  gradient = 'blue'
}: GradientCardProps) {
  const gradients = {
    blue: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50',
    purple:
      'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50',
    green:
      'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50',
    orange:
      'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50'
  };

  return (
    <Card className={cn('border-0 shadow-lg', gradients[gradient], className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
