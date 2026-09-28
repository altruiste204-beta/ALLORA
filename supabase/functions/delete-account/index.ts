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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 1: Check church ownership - cannot delete if sole owner
    const { data: ownedChurches, error: churchCheckError } = await supabaseClient
      .from('church_members')
      .select('church_id, churches(name, leader_ids)')
      .eq('user_id', user.id)
      .eq('role', 'OWNER');

    if (churchCheckError) {
      return new Response(JSON.stringify({ error: churchCheckError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (ownedChurches && ownedChurches.length > 0) {
      for (const item of ownedChurches) {
        const church = (item as any).churches;
        const otherLeaders = (church?.leader_ids || []).filter((id: string) => id !== user.id);
        if (otherLeaders.length === 0) {
          return new Response(
            JSON.stringify({
              error: `Impossible de supprimer votre compte : vous êtes l'unique propriétaire de l'église "${church?.name}". Vous devez désigner un autre propriétaire ou supprimer cette église au préalable.`
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      }
    }

    // Step 2: Delete related user documents
    await Promise.all([
      supabaseClient.from('church_members').delete().eq('user_id', user.id),
      supabaseClient.from('event_participants').delete().eq('user_id', user.id),
      supabaseClient.from('notifications').delete().eq('user_id', user.id),
      supabaseClient.from('contact_requests').delete().or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`),
      supabaseClient.from('profiles').delete().eq('id', user.id),
      supabaseClient.from('public_profiles').delete().eq('id', user.id),
    ]);

    // Step 3: Delete Auth User via Service Role client (or Admin API)
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (serviceRoleKey) {
      const adminClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        serviceRoleKey
      );
      await adminClient.auth.admin.deleteUser(user.id);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Votre compte a été supprimé avec succès.' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Erreur serveur' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
