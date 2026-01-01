# Database Connection Troubleshooting

## Current Issue
- **Direct connection**: DNS resolves to IPv6 only, Node.js connection fails with `ENOTFOUND`
- **Pooler connection**: Reaches server but fails with "Tenant or user not found"

## Solutions to Try

### 1. Check if Database is Paused
Supabase free tier databases pause after inactivity. Check your Supabase dashboard:
- Go to https://supabase.com/dashboard
- Select your project
- Check if the database shows as "Paused" - if so, click "Resume"

### 2. Verify Connection String
Get the **exact** connection string from Supabase dashboard:
1. Go to Project Settings → Database
2. Copy the connection string under "Connection string" or "Connection pooling"
3. Make sure you're using the correct one:
   - **Direct connection**: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
   - **Pooler connection**: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`

### 3. Verify Project Reference
Your project reference should be: `bvsebymssjcazguyukdi`
- Check in Supabase dashboard → Project Settings → General
- Verify the "Reference ID" matches

### 4. Check Firewall Settings
In Supabase dashboard:
1. Go to Project Settings → Database
2. Check "Connection Pooling" settings
3. Ensure your IP is not blocked
4. Try enabling "Allow connections from anywhere" temporarily for testing

### 5. Test Connection Manually
Try connecting using a PostgreSQL client:
- Use Supabase's built-in SQL Editor (should work if database is active)
- Or use a tool like pgAdmin, DBeaver, or `psql` command line

### 6. Alternative: Use Supabase Client Library
Instead of direct Prisma connection, you could use Supabase's JavaScript client library which handles connections differently.

## Next Steps
1. **First**: Check if database is paused and resume if needed
2. **Second**: Get the exact connection string from Supabase dashboard
3. **Third**: Update `.env.local` with the correct connection string
4. **Fourth**: Restart the server and test again

## Current Connection String Format
Your `.env.local` currently has:
```
DATABASE_URL="postgresql://postgres.bvsebymssjcazguyukdi:gNpIQDgC3em18YNh@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require"
```

This is the pooler format. If the pooler isn't working, try the direct connection format:
```
DATABASE_URL="postgresql://postgres:gNpIQDgC3em18YNh@db.bvsebymssjcazguyukdi.supabase.co:5432/postgres?sslmode=require"
```




