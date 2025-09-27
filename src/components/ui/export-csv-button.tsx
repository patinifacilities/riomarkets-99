import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExportCSVButtonProps {
  data: any[];
  filename: string;
  headers: string[];
  className?: string;
}

const ExportCSVButton = ({ data, filename, headers, className }: ExportCSVButtonProps) => {
  const exportToCSV = () => {
    if (!data || data.length === 0) return;

    // Criar cabeçalhos CSV
    const csvHeaders = headers.join(',');
    
    // Converter dados para CSV
    const csvData = data.map(row => {
      return headers.map(header => {
        const value = row[header.toLowerCase().replace(/\s+/g, '_')];
        // Escapar valores que contém vírgulas ou aspas
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',');
    }).join('\n');

    // Combinar cabeçalhos e dados
    const csvContent = `${csvHeaders}\n${csvData}`;

    // Criar e baixar arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button
      onClick={exportToCSV}
      variant="outline"
      size="sm"
      className={className}
      disabled={!data || data.length === 0}
    >
      <Download className="w-4 h-4 mr-2" />
      Exportar CSV
    </Button>
  );
};

export default ExportCSVButton;