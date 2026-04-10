import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function EinstellungenPage() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || '';
  const webhookUrl = projectId
    ? `https://${projectId}.supabase.co/functions/v1/create-lead`
    : 'Edge Function URL (nach Deployment verfügbar)';

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) { toast.error('Passwort muss mindestens 6 Zeichen lang sein'); return; }
    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPw(false);
    if (error) toast.error(error.message);
    else { toast.success('Passwort geändert'); setNewPassword(''); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">Einstellungen</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Webhook-Integration</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-sm text-muted-foreground">Webhook URL für n8n</Label>
            <div className="mt-1 flex gap-2">
              <Input value={webhookUrl} readOnly className="font-mono text-xs" />
              <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success('URL kopiert'); }}>Kopieren</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Sende POST-Requests an diese URL, um neue Leads zu erstellen.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Darstellung</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label>Dark Mode</Label>
            <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Account</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground">E-Mail</Label>
            <p className="text-sm mt-1">{user?.email}</p>
          </div>
          <div className="space-y-2">
            <Label>Passwort ändern</Label>
            <div className="flex gap-2">
              <Input type="password" placeholder="Neues Passwort" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              <Button onClick={handlePasswordChange} disabled={changingPw}>{changingPw ? 'Lädt...' : 'Ändern'}</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
