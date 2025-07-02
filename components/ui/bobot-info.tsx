import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface BobotInfoProps {
  totalBobot: number;
  jumlahKriteria: number;
}

export function BobotInfo({ totalBobot, jumlahKriteria }: BobotInfoProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <span>Total Kriteria: {jumlahKriteria}</span>
      <span>•</span>
      <span>Total Bobot: {totalBobot}</span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Info className="w-4 h-4 text-blue-500" />
          </TooltipTrigger>
          <TooltipContent>
            <div className="max-w-xs">
              <p className="font-medium mb-1">Skala Bobot Kriteria:</p>
              <ul className="text-xs space-y-1">
                <li>• 1 = Sangat Rendah</li>
                <li>• 2 = Rendah</li>
                <li>• 3 = Cukup</li>
                <li>• 4 = Tinggi</li>
                <li>• 5 = Sangat Tinggi</li>
              </ul>
              <p className="text-xs mt-2 text-gray-500">
                Bobot akan dinormalisasi otomatis dalam perhitungan TOPSIS
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
