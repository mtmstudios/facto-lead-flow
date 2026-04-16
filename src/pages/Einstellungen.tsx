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
import { motion } from 'framer-motion';
import { Webhook, Palette, Shield, Copy, Check } from 'lucide-react';

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
};

export default function EinstellungenPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);
  const [copied, setCopied] = useState(false);

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || '';
  const webhookUrl = projectId
    ? `https://${projectId}.supabase.co/functions/v1/create-lead`
    : 'Edge Function URL (nach Deployment verfügbar)';

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast.success('URL kopiert');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) { toast.error('Passwort muss mindestens 6 Zeichen lang sein'); return; }
    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPw(false);
    if (error) toast.error(error.message);
    else { toast.success('Passwort geändert'); setNewPassword(''); }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-2xl"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold tracking-tight">Einstellungen</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Konto und Integration verwalten</p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Webhook className="h-3.5 w-3.5 text-primary" /> Webhook-Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Webhook URL für n8n</Label>
              <div className="mt-1.5 flex gap-2">
                <Input value={webhookUrl} readOnly className="font-mono text-xs bg-background/50" />
                <Button variant="outline" size="sm" onClick={handleCopy} className="h-9 shrink-0">
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">Sende POST-Requests an diese URL, um neue Leads zu erstellen.</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5 text-primary" /> Darstellung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Dark Mode</Label>
                <p className="text-[11px] text-muted-foreground mt-0.5">Dunkles Farbschema verwenden (coming soon)</p>
              </div>
              <Switch checked={false} disabled />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-primary" /> Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">E-Mail</Label>
              <p className="text-sm mt-1 font-medium">{user?.email}</p>
            </div>
            <div className="pt-3 border-t border-border/30 space-y-2">
              <Label className="font-medium">Passwort ändern</Label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Neues Passwort (min. 6 Zeichen)"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="bg-background/50"
                />
                <Button onClick={handlePasswordChange} disabled={changingPw} className="shrink-0">
                  {changingPw ? 'Lädt...' : 'Ändern'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
