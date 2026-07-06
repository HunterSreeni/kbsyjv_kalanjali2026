-- Correction: Dance is female-only, not male-only (0006 had it wrong).
update public.games set gender_restriction = 'female' where slug = 'dance';
