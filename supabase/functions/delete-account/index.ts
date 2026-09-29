import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Configuration serveur Supabase incomplète');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // All privileged work is performed server-side with the service role.
    // The key never exists in the browser bundle.
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // A church must never be left without an OWNER.
    const { data: ownedMemberships, error: ownerError } = await admin
      .from('church_members')
      .select('church_id')
      .eq('user_id', user.id)
      .eq('role', 'OWNER')
      .eq('status', 'approved');

    if (ownerError) throw ownerError;

    for (const membership of ownedMemberships ?? []) {
      const { count, error: countError } = await admin
        .from('church_members')
        .select('id', { count: 'exact', head: true })
        .eq('church_id', membership.church_id)
        .eq('role', 'OWNER')
        .eq('status', 'approved')
        .neq('user_id', user.id);

      if (countError) throw countError;

      if ((count ?? 0) === 0) {
        return new Response(
          JSON.stringify({
            error: 'Impossible de supprimer votre compte : vous êtes le seul propriétaire approuvé d’une église. Transférez d’abord la propriété.'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // The hardening migration adds ON DELETE CASCADE/SET NULL to the
    // user-owned relational graph. Deleting auth.users is therefore the
    // single authoritative deletion operation.
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;

    return new Response(
      JSON.stringify({ success: true, message: 'Votre compte ALLORA et ses données associées ont été supprimés.' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
