-- Fix RLS recursion by using a security definer function
-- This allows checking roles without triggering RLS on the users table recursively.

-- 1. Create a helper function to get the current user's role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT role FROM public.users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing problematic policies
DROP POLICY IF EXISTS "Mentors can manage all students" ON public.students;
DROP POLICY IF EXISTS "Students can see themselves" ON public.students;
DROP POLICY IF EXISTS "Mentors can manage all sessions" ON public.sessions;
DROP POLICY IF EXISTS "Students can view all sessions" ON public.sessions;
DROP POLICY IF EXISTS "Mentors can manage all attendance" ON public.attendance;
DROP POLICY IF EXISTS "Students can see own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Mentors can manage all materials" ON public.materials;
DROP POLICY IF EXISTS "Students can view all materials" ON public.materials;
DROP POLICY IF EXISTS "Mentors can manage import logs" ON public.import_log;
DROP POLICY IF EXISTS "Mentors can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- 3. Re-create policies using the helper function or optimized checks

-- Users
CREATE POLICY "Users can view own profile" ON public.users 
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public.users 
    FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.users 
    FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "Mentors can view all users" ON public.users 
    FOR SELECT USING (public.get_user_role(auth.uid()) = 'mentor');

-- Students
CREATE POLICY "Mentors can manage all students" ON public.students 
    FOR ALL USING (public.get_user_role(auth.uid()) = 'mentor');

CREATE POLICY "Students can see themselves" ON public.students 
    FOR SELECT USING (
        id = (SELECT student_id FROM public.users WHERE id = auth.uid())
    );

-- Sessions
CREATE POLICY "Mentors can manage all sessions" ON public.sessions 
    FOR ALL USING (public.get_user_role(auth.uid()) = 'mentor');

CREATE POLICY "Students can view all sessions" ON public.sessions 
    FOR SELECT TO authenticated USING (true);

-- Attendance
CREATE POLICY "Mentors can manage all attendance" ON public.attendance 
    FOR ALL USING (public.get_user_role(auth.uid()) = 'mentor');

CREATE POLICY "Students can see own attendance" ON public.attendance 
    FOR SELECT USING (
        student_id = (SELECT student_id FROM public.users WHERE id = auth.uid())
    );

-- Materials
CREATE POLICY "Mentors can manage all materials" ON public.materials 
    FOR ALL USING (public.get_user_role(auth.uid()) = 'mentor');

CREATE POLICY "Students can view all materials" ON public.materials 
    FOR SELECT TO authenticated USING (true);

-- ImportLog
CREATE POLICY "Mentors can manage import logs" ON public.import_log 
    FOR ALL USING (public.get_user_role(auth.uid()) = 'mentor');
