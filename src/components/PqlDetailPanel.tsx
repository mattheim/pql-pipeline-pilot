import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/StatusBadge';
import { usePqlDetail, useUpdatePqlStatus, useUpdateEmailDraft, useLogActivity, useDeletePql } from '@/hooks/use-pqls';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Send, XCircle, Building2, Users, Sparkles, Trash2 } from 'lucide-react';

interface PqlDetailPanelProps {
  pqlId: string;
  onClose: () => void;
}

export function PqlDetailPanel({ pqlId, onClose }: PqlDetailPanelProps) {
  const { data, isLoading } = usePqlDetail(pqlId);
  const updateStatus = useUpdatePqlStatus();
  const updateDraft = useUpdateEmailDraft();
  const logActivity = useLogActivity();
  const deletePql = useDeletePql();

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [offer, setOffer] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (data?.emailDraft) {
      setSubject(data.emailDraft.subject);
      setBody(data.emailDraft.body);
      setOffer(data.emailDraft.proposed_offer ?? '');
    }
  }, [data?.emailDraft]);

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  if (!data) return null;

  const { pql, enrichment, emailDraft } = data;

  const handleApproveAndSend = async () => {
    if (!emailDraft) return;
    setSending(true);
    try {
      // Save any edits first
      if (subject !== emailDraft.subject || body !== emailDraft.body || offer !== (emailDraft.proposed_offer ?? '')) {
        await updateDraft.mutateAsync({ id: emailDraft.id, subject, body, proposed_offer: offer });
      }

      // Call send-email edge function
      const { data: result, error } = await supabase.functions.invoke('send-email', {
        body: { to: emailDraft.to_email, subject, body, from: 'PQL Command <noreply@yourdomain.com>' },
      });

      if (error) throw error;

      // Keep status as 'qualified' or 'pending'; sent state is tracked via activity_log
      await logActivity.mutateAsync({ pql_id: pqlId, action: 'email_sent', details: { to: emailDraft.to_email } });
      toast({ title: 'Email sent successfully!' });
      onClose();
    } catch (e: any) {
      toast({ title: 'Failed to send', description: e.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const handleReject = async () => {
    await updateStatus.mutateAsync({ id: pqlId, status: 'rejected' });
    await logActivity.mutateAsync({ pql_id: pqlId, action: 'rejected' });
    toast({ title: 'PQL rejected' });
    onClose();
  };

  const handleDelete = async () => {
    try {
      await deletePql.mutateAsync(pqlId);
      onClose();
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e.message, variant: 'destructive' });
    }
  };

  const companyInfo = enrichment?.company_info as Record<string, unknown> | null;
  const keyContacts = enrichment?.key_contacts as Array<Record<string, unknown>> | null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{pql.company_name || pql.email}</h2>
          <StatusBadge status={pql.status} />
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
      </div>

      {/* Enrichment Info */}
      {enrichment && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5"><Building2 className="h-4 w-4" /> Company Info</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            {companyInfo && Object.entries(companyInfo).map(([k, v]) => (
              <div key={k}><span className="font-medium capitalize">{k.replace(/_/g, ' ')}:</span> {String(v)}</div>
            ))}
          </CardContent>
        </Card>
      )}

      {keyContacts && keyContacts.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5"><Users className="h-4 w-4" /> Key Contacts</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            {keyContacts.map((c, i) => (
              <div key={i}>{String(c.name ?? '')} — {String(c.title ?? '')} ({String(c.email ?? '')})</div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* AI Reasoning */}
      {emailDraft?.ai_reasoning && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5"><Sparkles className="h-4 w-4" /> AI Reasoning</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground whitespace-pre-wrap">{emailDraft.ai_reasoning}</CardContent>
        </Card>
      )}

      {/* Email Draft Editor */}
      {emailDraft && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Email Draft</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">To</label>
              <Input value={emailDraft.to_email} disabled className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Subject</label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Body</label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} className="mt-1 min-h-[200px]" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Proposed Offer</label>
              <Input value={offer} onChange={(e) => setOffer(e.target.value)} className="mt-1" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {emailDraft && pql.status !== 'rejected' && (
          <Button onClick={handleApproveAndSend} disabled={sending} className="flex-1">
            <Send className="mr-2 h-4 w-4" />
            {sending ? 'Sending…' : 'Approve & Send'}
          </Button>
        )}
        {pql.status !== 'rejected' && (
          <Button variant="outline" onClick={handleReject} className="flex-1 text-destructive hover:text-destructive">
            <XCircle className="mr-2 h-4 w-4" />
            Reject
          </Button>
        )}
        <Button
          variant="outline"
          onClick={handleDelete}
          className="flex-1 text-destructive hover:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}
