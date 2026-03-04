-- The existing policies have no trailing space in name (previous drop already removed the space-versions)
-- Drop remaining policies (without trailing space) and recreate as permissive

-- consent_forms
DROP POLICY IF EXISTS "Admins can manage consent forms" ON public.consent_forms;
CREATE POLICY "Admins can manage consent forms"
  ON public.consent_forms FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- attendance_records  
DROP POLICY IF EXISTS "Admins can manage attendance records" ON public.attendance_records;
CREATE POLICY "Admins can manage attendance records"
  ON public.attendance_records FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- members
DROP POLICY IF EXISTS "Admins can manage members" ON public.members;
CREATE POLICY "Admins can manage members"
  ON public.members FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- user_roles
DROP POLICY IF EXISTS "Super admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;

CREATE POLICY "Super admins can manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);