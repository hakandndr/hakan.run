<?php
// ─────────────────────────────────────────────────────────────────────────────
// secure-config.sample.php  →  copy to  secure-config.php  on the SERVER only.
//
// secure-config.php is git-ignored and denied by .htaccess, so it is never
// committed and never served to the public. It holds the values get_log.php
// needs to verify that a request comes from a logged-in admin.
//
// Both values below are PUBLIC (same as the browser bundle) — they are kept in
// a separate file only to keep the PHP tidy and easy to rotate.
// ─────────────────────────────────────────────────────────────────────────────

return [
    // Your Supabase project URL, e.g. https://abcd1234.supabase.co
    'supabase_url'      => 'https://your-project-id.supabase.co',

    // Your Supabase anon (publishable) key
    'supabase_anon_key' => 'your-anon-key-here',
];
