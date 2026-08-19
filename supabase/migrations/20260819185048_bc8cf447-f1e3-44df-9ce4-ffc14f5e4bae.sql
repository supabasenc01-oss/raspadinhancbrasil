-- Allow public access to all buckets for reading
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT TO public
USING (true);

-- Allow authenticated users to upload to all buckets
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (true);

-- Allow all authenticated users to manage objects (simplified for now)
DROP POLICY IF EXISTS "Authenticated Management" ON storage.objects;
CREATE POLICY "Authenticated Management" ON storage.objects
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);
