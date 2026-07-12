# /run/ — server-side endpoints (deploy separately from the SPA)

These PHP files must live in a folder named `run/` at your web root, so they are
reachable at https://hakan.run/run/... (the app fetches /run/get_log.php and
/run/log_hakanrun.php).

## Deploy
1. Upload `get_log.php`, `log_hakanrun.php`, `.htaccess` into `public_html/run/`.
2. Copy `secure-config.sample.php` to `secure-config.php` (same folder) and fill in
   your Supabase URL + anon key. Never commit `secure-config.php`.
3. The visitor log file `hakanrun_panel_log.txt` is created automatically on first visit.

secure-config.php and *.txt are blocked from public access by .htaccess.
