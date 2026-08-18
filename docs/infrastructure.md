# Infrastructure

There is currently no deployment infrastructure for this project.

Netco Expense is a frontend-only demo application with no backend, no database, no CI/CD
pipeline, and no cloud resources (AWS or otherwise) provisioned or defined in this repository.
It runs locally via `npm run dev` / `npm run build` + `npm run preview` (see `README.md`).

This document will be populated once real deployment architecture exists — e.g. a hosting target
for the built static assets, a backend service, and/or infrastructure-as-code. Until then, do not
assume or invent an infrastructure design; check `TODO.md` for any forward-looking plans before
adding one.
