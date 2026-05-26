# Local Setup Notes

This file is for private local development notes only. Do not commit real credentials or production secrets here.

Your actual backend environment file is:

```text
artifacts/api-server/.env
```

Local demo data can be enabled with:

```env
SEED_DEMO_DATA=true
DEMO_SCHOOL_PASSWORD=your-local-school-password
DEMO_TEACHER_PIN=your-local-six-digit-pin
```

When demo data is enabled, set `DEMO_SCHOOL_PASSWORD` and `DEMO_TEACHER_PIN` yourself if you need predictable local logins.

Before pushing or sharing the repository, confirm that these files are not staged:

```text
artifacts/api-server/.env
*.log
node_modules/
dist/
```
