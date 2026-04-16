import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, Lock, Mail } from 'lucide-react';
import logoImg from '@/assets/logo.png';
import mtmLogoImg from '@/assets/mtm-logo.png';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.message === 'Invalid login credentials'
        ? 'Ungültige Anmeldedaten'
        : error.message
      );
    }
  };

  return (
    <div className="flex min-h-screen bg-background relative overflow-hidden">
      {/* Left side — branding panel (desktop only) */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative bg-gradient-to-br from-[hsl(214,65%,45%)] via-[hsl(214,60%,40%)] to-[hsl(214,70%,30%)] items-center justify-center p-12">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />
        {/* Gradient orbs */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative z-10 max-w-md space-y-8"
        >
          <img src={logoImg} alt="factonet" className="h-10 w-auto brightness-0 invert" />
          <div className="space-y-4">
            <h2 className="text-3xl xl:text-4xl font-black text-white tracking-tight leading-tight">
              Ihr Fördermittel-<br />Dashboard
            </h2>
            <p className="text-white/60 text-base leading-relaxed">
              Leads verwalten, Pipeline steuern, Mandate gewinnen — alles in einer Oberfläche.
            </p>
          </div>
          <div className="flex items-center gap-6 pt-4">
            <div className="text-center">
              <p className="text-2xl font-black text-white num">100%</p>
              <p className="text-xs text-white/40 mt-1">Übersicht</p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-black text-white num">3×</p>
              <p className="text-xs text-white/40 mt-1">schneller</p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-black text-white num">24/7</p>
              <p className="text-xs text-white/40 mt-1">Zugriff</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right side — login form */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        {/* Background blur orbs (visible on all screens) */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="relative z-10 w-full max-w-[380px]"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img src={logoImg} alt="factonet" className="h-9 w-auto" />
          </div>

          {/* Form header */}
          <div className="text-center mb-8 lg:text-left">
            <h1 className="text-2xl font-black tracking-tight">Willkommen</h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Melden Sie sich in Ihrem Dashboard an
            </p>
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input
                  type="email"
                  placeholder="E-Mail-Adresse"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="h-12 pl-11 bg-muted/30 border-border/50 focus:bg-background transition-colors"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input
                  type="password"
                  placeholder="Passwort"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-12 pl-11 bg-muted/30 border-border/50 focus:bg-background transition-colors"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-12 font-semibold text-sm group"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Anmelden
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </Button>
          </form>

          {/* Footer — Agency branding */}
          <div className="flex flex-col items-center gap-1.5 mt-10">
            <span className="text-[10px] text-muted-foreground/30">powered by</span>
            <a
              href="https://mtmstudios.de"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-70 transition-opacity"
            >
              <img src={mtmLogoImg} alt="MTM Studios" className="h-5 w-auto opacity-40" />
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
