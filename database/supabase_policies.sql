-- RLS POLICIES FOR FULL CRUD ACCESS
-- Run this script in your Supabase SQL Editor to enable Add/Edit/Delete operations.

-- 1. Students Table
create policy "Authenticated users can insert students" on public.students for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update students" on public.students for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete students" on public.students for delete using (auth.role() = 'authenticated');

-- 2. Classes Table
create policy "Authenticated users can insert classes" on public.classes for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update classes" on public.classes for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete classes" on public.classes for delete using (auth.role() = 'authenticated');

-- 3. Subjects Table
create policy "Authenticated users can insert subjects" on public.subjects for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update subjects" on public.subjects for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete subjects" on public.subjects for delete using (auth.role() = 'authenticated');

-- 4. Schedules Table
create policy "Authenticated users can insert schedules" on public.schedules for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update schedules" on public.schedules for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete schedules" on public.schedules for delete using (auth.role() = 'authenticated');

-- 5. Attendance Table
create policy "Authenticated users can insert attendance" on public.attendance for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update attendance" on public.attendance for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete attendance" on public.attendance for delete using (auth.role() = 'authenticated');

-- 6. Points Log Table
create policy "Authenticated users can insert points_log" on public.points_log for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update points_log" on public.points_log for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete points_log" on public.points_log for delete using (auth.role() = 'authenticated');
