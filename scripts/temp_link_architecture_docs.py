from pathlib import Path

handoff = Path('docs/WORK_HANDOFF_2026-09-16.md')
text = handoff.read_text()
marker = '## REQUIRED ARCHITECTURE READING'
block = '''\n\n## REQUIRED ARCHITECTURE READING\n\nBefore implementing the active Booking Core, read these documents in order:\n\n1. `docs/BOOKING_CORE_PRODUCT_VISION.md`\n2. `docs/ARCHITECTURE_REFERENCE.md`\n3. `docs/ARCHITECTURE_DECISION_REGISTER.md`\n\n`ARCHITECTURE_REFERENCE.md` is the active technical baseline for platform, domain, database, multi-tenancy, security, AI, asynchronous work, integrations, performance, observability, privacy, testing and scaling.\n\n`ARCHITECTURE_DECISION_REGISTER.md` records accepted choices and the evidence required before re-opening them. Structural implementation must not casually contradict these decisions.\n\nCurrent rule: design the scalable domain/data/security boundary first, then implement vertical slices. Do not add infrastructure complexity merely to look enterprise-ready.\n'''
if marker not in text:
    handoff.write_text(text.rstrip() + block + '\n')

vision = Path('docs/BOOKING_CORE_PRODUCT_VISION.md')
text = vision.read_text()
marker = '## Architecture baseline'
block = '''\n\n## Architecture baseline\n\nThe Booking Core product vision must be implemented against:\n\n- `docs/ARCHITECTURE_REFERENCE.md`\n- `docs/ARCHITECTURE_DECISION_REGISTER.md`\n\nThese documents define the scalable domain boundaries and current technology decisions. Product UX may evolve rapidly; tenant isolation, data ownership, security boundaries, persistence and integration contracts must evolve deliberately.\n'''
if marker not in text:
    vision.write_text(text.rstrip() + block + '\n')
