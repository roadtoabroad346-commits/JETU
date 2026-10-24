# Authentication routes

Localized signup, login, password recovery and reset pages use Supabase Auth with
server actions. PKCE and token confirmation are handled by the global `/auth`
route handlers; session cookies are refreshed by the root proxy.
