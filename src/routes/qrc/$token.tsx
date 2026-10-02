import { createFileRoute, redirect } from '@tanstack/react-router';
import { normalizeCrockford } from '#/lib/crockford';
import { supabase } from '#/lib/supabase';
import { LucideQrCode, AlertCircle } from 'lucide-react';

export const Route = createFileRoute('/qrc/$token')({
  loader: async ({ params }) => {
    const { valid, normalized } = normalizeCrockford(params.token);
    if (!valid || normalized.length !== 6) {
      return { status: 'invalid' as const, token: params.token };
    }

    const { data: cred } = await supabase
      .from('credentials')
      .select('status, type, credential_assignments(member_id, unassigned_at)')
      .eq('type', 'qrc')
      .eq('token', normalized)
      .maybeSingle();

    if (!cred) return { status: 'not_found' as const, token: normalized };

    const activeAssignment = cred.credential_assignments?.find((a: any) => !a.unassigned_at);
    if (activeAssignment?.member_id) {
      throw redirect({ to: '/member/$memberId', params: { memberId: activeAssignment.member_id } });
    }

    return { status: cred.status as 'free' | 'deleted', token: normalized };
  },
  component: CredentialResolutionView,
});

function CredentialResolutionView() {
  const data = Route.useLoaderData();
  if (!data) return null;


  if (data.status === 'invalid' || data.status === 'not_found') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="glass-card max-w-md w-full p-8 text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold">Invalid Credential</h1>
          <p className="text-muted-foreground font-mono text-lg">{data.token}</p>
          <p className="text-muted-foreground">This QR code is not recognized by our system.</p>
        </div>
      </div>
    );
  }

  if (data.status === 'deleted') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="glass-card max-w-md w-full p-8 text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto" />
          <h1 className="text-2xl font-bold">Credential Retired</h1>
          <p className="text-muted-foreground font-mono text-lg">{data.token}</p>
          <p className="text-muted-foreground">This badge has been permanently retired and is no longer valid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="glass-card max-w-md w-full p-8 text-center space-y-4 border-green-500/20 shadow-green-500/10">
        <div className="bg-green-500/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
          <LucideQrCode className="w-12 h-12 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-green-500">Unassigned Badge</h1>
        <p className="text-muted-foreground font-mono text-xl tracking-widest">{data.token}</p>
        <p className="text-muted-foreground mt-4">
          This badge is valid and ready to be assigned to a member.
        </p>
      </div>
    </div>
  );
}
