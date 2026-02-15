import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useInsertPqls } from '@/hooks/use-pqls';
import { Upload, FileSpreadsheet, Loader2 } from 'lucide-react';
import { AGENTS_API_BASE_URL } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ParsedRow {
  [key: string]: string;
}

export function CsvUploader() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const [processing, setProcessing] = useState(false);
  const insertPqls = useInsertPqls();

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) return;
      const hdrs = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
      setHeaders(hdrs);
      const parsed = lines.slice(1).map((line) => {
        const vals = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
        const row: ParsedRow = {};
        hdrs.forEach((h, i) => { row[h] = vals[i] ?? ''; });
        return row;
      });
      setRows(parsed);
    };
    reader.readAsText(file);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleImportAndProcess = async () => {
    if (rows.length === 0) return;
    setProcessing(true);
    try {
      // Map CSV rows to PQL records
      const pqlRows = rows.map((row) => ({
        email: row.email || row.Email || '',
        company_name: row.company_name || row.Company || row.company || null,
        product_usage_score: Number(row.product_usage_score || row.score || 0) || null,
        last_active_date: row.last_active_date || row.last_active || null,
        raw_data: row as any,
        status: 'pending' as const,
      }));

      const inserted = await insertPqls.mutateAsync(pqlRows);

      // Send to agents API for qualification
      try {
        const response = await fetch(`${AGENTS_API_BASE_URL}/qualify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pqls: inserted }),
        });
        if (response.ok) {
          const results = await response.json();
          // Update PQLs with qualification results
          for (const result of results.qualified || []) {
            await supabase.from('pqls').update({
              status: 'qualified',
              qualification_result: result.qualification_result,
              agent_metadata: result.agent_metadata,
            }).eq('id', result.id);
          }
          toast({ title: `${results.qualified?.length ?? 0} PQLs qualified` });
        }
      } catch {
        toast({ title: 'Agents API not reachable', description: 'PQLs saved but not yet qualified. Start your local API to process them.', variant: 'destructive' });
      }

      setRows([]);
      setHeaders([]);
      setFileName('');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card className="border-2 border-dashed border-border shadow-none">
        <CardContent className="p-0">
          <label
            className="flex flex-col items-center justify-center py-16 cursor-pointer hover:bg-accent/50 transition-colors rounded-lg"
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
          >
            <Upload className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">Drop a CSV file here or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">Supports .csv files with labeled columns</p>
            <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </label>
        </CardContent>
      </Card>

      {/* Preview */}
      {rows.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                {fileName} — {rows.length} rows
              </CardTitle>
              <Button onClick={handleImportAndProcess} disabled={processing}>
                {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {processing ? 'Processing…' : 'Import & Process PQLs'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[400px] overflow-auto rounded border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map((h) => <TableHead key={h}>{h}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 50).map((row, i) => (
                    <TableRow key={i}>
                      {headers.map((h) => <TableCell key={h}>{row[h]}</TableCell>)}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {rows.length > 50 && <p className="text-xs text-muted-foreground mt-2">Showing first 50 of {rows.length} rows</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
