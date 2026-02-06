# LLM Cost Dashboard — TODO

## Done
- [x] Next.js 14 scaffold with TypeScript + Tailwind
- [x] SQLite data model (projects, usage_records, budgets, budget_alerts)
- [x] Seed data generator (90 days, 4 projects, 8 models)
- [x] Dashboard overview page (stat cards, spend chart, provider pie, project table)
- [x] Projects page with cost breakdown
- [x] Project detail page (daily spend, provider breakdown, model usage)
- [x] Providers page (comparison cards, model table, spend over time)
- [x] Budgets page (alerts, status tracking, budget table)
- [x] API routes (dashboard, usage, projects, budgets, seed)
- [x] Recharts charts (AreaChart, PieChart, BarChart)
- [x] Dark theme with sidebar navigation
- [x] Build passing clean

## Next
- [x] Tailwind CSS setup (tailwind.config.ts + postcss.config.js already present and working)
- [x] Deploy to Vercel (https://llm-cost-dashboard-ashy.vercel.app)
- [ ] Add Clawdbot integration (auto-ingest usage from gateway logs)
- [ ] Real-time data ingestion webhook
- [ ] Cost optimization suggestions engine
- [ ] Email digest (weekly spend summary)
- [x] Export to CSV
- [x] Date range picker on all pages
- [ ] Alerts via Telegram when budget threshold hit
- [ ] Multi-user auth
