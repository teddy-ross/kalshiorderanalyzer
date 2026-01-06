# Security Guidelines

## Protected Files

The following files and patterns are automatically ignored by git to protect sensitive information:

### Environment Variables
- `.env` - Main environment file with API keys
- `.env.*` - Any environment-specific files (`.env.local`, `.env.production`, etc.)
- `*.env` - Any file ending in `.env`

### API Keys and Secrets
- `*.key` - Private key files
- `*.pem` - PEM certificate files
- `*.p12`, `*.pfx` - Certificate files
- `*_key`, `*_keys` - Files with "key" in the name
- `secrets/`, `.secrets/` - Secret directories

### Database Files
- `*.db` - SQLite database files
- `*.sqlite`, `*.sqlite3` - SQLite database files
- `*.db-shm`, `*.db-wal` - SQLite shared memory and write-ahead log files
- `data/` - Directory containing database files
- `*.sql` - SQL dump files

## Before Committing

Always verify that sensitive files are not being committed:

```bash
# Check what files would be committed
git status

# Verify specific files are ignored
git check-ignore -v backend/.env
git check-ignore -v backend/data/orderflow.db
```

## If You Accidentally Committed Secrets

If you accidentally committed sensitive information:

1. **Immediately rotate your API keys** in your Kalshi account
2. Remove the file from git history:
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch backend/.env" \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. Force push (if already pushed to remote):
   ```bash
   git push origin --force --all
   ```
4. Consider using `git-secret` or `git-crypt` for additional protection

## Best Practices

1. **Never commit `.env` files** - Always use `.env.example` as a template
2. **Use environment variables** - Never hardcode API keys in source code
3. **Rotate keys regularly** - Change API keys periodically
4. **Use different keys for dev/prod** - Never use production keys in development
5. **Review commits before pushing** - Always check `git diff` before committing

## Example .env File Structure

Your `.env` file should look like this (never commit this):

```env
KALSHI_API_KEY=your_actual_api_key_here
KALSHI_PRIVATE_KEY=your_actual_private_key_here
KALSHI_ENVIRONMENT=demo
PORT=3001
CORS_ORIGIN=http://localhost:5173
DB_PATH=./data/orderflow.db
```

The `env.example` file (which IS committed) should only contain placeholders:

```env
KALSHI_API_KEY=your_api_key_here
KALSHI_PRIVATE_KEY=your_private_key_here
KALSHI_ENVIRONMENT=prod
```
