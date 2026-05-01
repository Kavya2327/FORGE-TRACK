-- ForgeTrack Seed Data
-- Location: backend/seed.sql

-- 1. Insert Students
INSERT INTO public.students (name, usn, branch_code, batch) VALUES
('Abhishek Sharma', '4SH24CS001', 'CS', '2024-2028'),
('Divya Kulkarni', '4SH24CS002', 'AI', '2024-2028'),
('Ravi Kumar', '4SH24CS003', 'CS', '2024-2028'),
('Priya Singh', '4SH24CS004', 'IS', '2024-2028'),
('Aditya Rao', '4SH24CS005', 'CS', '2024-2028'),
('Sneha Patil', '4SH24CS006', 'AI', '2024-2028'),
('Vikram Mehra', '4SH24CS007', 'CS', '2024-2028'),
('Ananya Iyer', '4SH24CS008', 'IS', '2024-2028'),
('Karthik N', '4SH24CS009', 'CS', '2024-2028'),
('Meghana R', '4SH24CS010', 'AI', '2024-2028'),
('Sohan Das', '4SH24CS011', 'CS', '2024-2028'),
('Riya Kapoor', '4SH24CS012', 'IS', '2024-2028'),
('Arjun V', '4SH24CS013', 'CS', '2024-2028'),
('Ishita G', '4SH24CS014', 'AI', '2024-2028'),
('Rahul Hegde', '4SH24CS015', 'CS', '2024-2028'),
('Sanjana S', '4SH24CS016', 'IS', '2024-2028'),
('Manoj B', '4SH24CS017', 'CS', '2024-2028'),
('Kavya P', '4SH24CS018', 'AI', '2024-2028'),
('Nitin S', '4SH24CS019', 'CS', '2024-2028'),
('Deepa M', '4SH24CS020', 'IS', '2024-2028'),
('Varun K', '4SH24CS021', 'CS', '2024-2028'),
('Shreya J', '4SH24CS022', 'AI', '2024-2028'),
('Prakash L', '4SH24CS023', 'CS', '2024-2028'),
('Tanvi D', '4SH24CS024', 'IS', '2024-2028'),
('Rohan M', '4SH24CS025', 'CS', '2024-2028');

-- 2. Insert Sessions
INSERT INTO public.sessions (date, topic, month_number, duration_hours, session_type) VALUES
('2026-04-01', '8-Layer AI Stack', 4, 2.0, 'offline'),
('2026-04-02', 'Prompt Engineering Fundamentals', 4, 2.0, 'offline'),
('2026-04-03', 'LLM Architectures', 4, 2.5, 'online'),
('2026-04-08', 'ReAct Agent Pattern', 4, 2.0, 'offline'),
('2026-04-09', 'Chain of Thought Reasoning', 4, 2.0, 'offline'),
('2026-04-10', 'Function Calling with GPT-4o', 4, 2.0, 'online'),
('2026-04-15', 'pgvector RAG Implementation', 5, 2.0, 'offline'),
('2026-04-16', 'Chunking Strategies & Embeddings', 5, 2.0, 'offline'),
('2026-04-17', 'Hybrid Search in Postgres', 5, 2.0, 'online'),
('2026-04-22', 'Tiered Autonomy Multi-Agent', 5, 2.0, 'offline'),
('2026-04-23', 'Agentic Workflow Design', 5, 2.0, 'offline'),
('2026-04-24', 'LangGraph State Management', 5, 2.0, 'online'),
('2026-04-29', 'AI System Evaluation', 6, 2.0, 'offline'),
('2026-04-30', 'Deployment & Scaling AI Apps', 6, 2.0, 'offline'),
('2026-05-01', 'Future of AI Engineering', 6, 2.0, 'online');

-- 3. Insert Attendance (Sample for first 5 students)
-- Present for all except student 3 and 5 who missed some
INSERT INTO public.attendance (student_id, session_id, present, marked_by)
SELECT s.id, ses.id, true, 'system'
FROM public.students s, public.sessions ses
WHERE s.id <= 5;

-- Update some to absent for realism
UPDATE public.attendance SET present = false WHERE student_id = 3 AND session_id % 3 = 0;
UPDATE public.attendance SET present = false WHERE student_id = 5 AND session_id % 4 = 0;

-- 4. Insert Materials
INSERT INTO public.materials (session_id, title, type, url, description) VALUES
(1, '8-Layer AI Stack Slides', 'slides', 'https://drive.google.com/example1', 'Core curriculum slides'),
(1, 'Session Recording - Layer 1-4', 'recording', 'https://youtube.com/example1', 'Video recording of the first half'),
(4, 'ReAct Pattern Exercises', 'document', 'https://github.com/example/react', 'Coding exercise for agents'),
(7, 'pgvector Guide', 'link', 'https://supabase.com/docs/guides/database/extensions/pgvector', 'Official documentation');
