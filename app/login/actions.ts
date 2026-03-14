'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { encryptPassword, decryptPassword, generateRandomPassword } from '@/lib/key-auth';

type State = { error: string };

export async function loginWithLicenseKey(_prev: State, formData: FormData): Promise<State> {
  const keyValue = (formData.get('license_key') as string)?.trim();
  if (!keyValue) return { error: 'Bitte Lizenzkey eingeben.' };

  const adminKey = (process.env.ADMIN_KEY ?? 'HAT-JONAS').trim();
  if (keyValue.toLowerCase() === adminKey.toLowerCase()) {
    const { setAdminSession } = await import('@/lib/admin-auth');
    const supabaseAdmin = createServiceClient();
    const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@brospify.local';
    const adminPassword = adminKey;

    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const adminUser = list?.users?.find((u) => u.email?.toLowerCase() === adminEmail.toLowerCase());
    if (!adminUser) {
      const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
      });
      if (createErr && createErr.message !== 'A user with this email already exists') {
        return { error: createErr.message };
      }
    }

    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });
    if (signInError) {
      return { error: signInError.message };
    }
    await setAdminSession();
    redirect('/admin');
  }

  const supabaseAdmin = createServiceClient();
  // Case-insensitive Suche (Groß-/Kleinschreibung egal), Sonderzeichen für LIKE escapen
  const searchPattern = keyValue.replace(/[%_\\]/g, '\\$&');
  const { data: keyRow, error: keyError } = await supabaseAdmin
    .from('internal_keys')
    .select('id, key_value, used_at, user_id, encrypted_password, active')
    .ilike('key_value', searchPattern)
    .maybeSingle();

  if (keyError) {
    return { error: `Key-Abfrage fehlgeschlagen: ${keyError.message}` };
  }
  if (!keyRow) {
    return { error: 'Ungültiger oder unbekannter Lizenzkey. Key zuerst im Admin unter „Keys (Masse)“ anlegen.' };
  }
  if (keyRow.active === false) {
    return { error: 'Dieser Lizenzkey ist deaktiviert. Bitte Admin kontaktieren.' };
  }

  const keyId = keyRow.id;
  let email: string;
  let password: string;

  if (!keyRow.used_at) {
    // Erste Nutzung: Supabase-User anlegen und Key als benutzt markieren
    email = `key-${keyId}@brospify.local`;
    password = generateRandomPassword();
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createError || !newUser.user) {
      return { error: createError?.message ?? 'User konnte nicht angelegt werden.' };
    }
    const encrypted = encryptPassword(password);
    const { error: updateError } = await supabaseAdmin
      .from('internal_keys')
      .update({
        user_id: newUser.user.id,
        used_at: new Date().toISOString(),
        encrypted_password: encrypted,
      })
      .eq('id', keyId);
    if (updateError) {
      return { error: `Key konnte nicht aktualisiert werden: ${updateError.message}` };
    }
  } else {
    // Bereits eingelöster Key: User-Daten zum Anmelden verwenden
    if (!keyRow.user_id || !keyRow.encrypted_password) {
      return { error: 'Dieser Key ist ungültig konfiguriert. Bitte Admin kontaktieren.' };
    }
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(keyRow.user_id);
    if (userError) {
      return { error: `Zugehöriger Account konnte nicht geladen werden: ${userError.message}` };
    }
    if (!user?.user?.email) {
      return { error: 'Zugehöriger Account nicht gefunden.' };
    }
    email = user.user.email;
    try {
      password = decryptPassword(keyRow.encrypted_password);
    } catch {
      return {
        error:
          'Der gespeicherte Key-Login ist ungültig oder veraltet. Bitte Key im Admin neu erstellen und erneut einlösen.',
      };
    }
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    return { error: signInError.message };
  }
  redirect('/dashboard');
}
