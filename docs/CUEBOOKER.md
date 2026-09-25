# Cuebooker

Single Source of Truth

Version: V1 Beta Preparation

Last updated: 24 September 2026

---

# Product Identity

Cuebooker is a booking workspace for DJs, artists, managers and agencies.

It centralizes booking requests, communication, scheduling and professional identity while keeping commercial decisions in human hands.

---

# Current State

Phase:
V1 Beta Preparation

Implemented foundations:

- Authentication and workspaces.
- Artist profiles.
- Booking workflow foundation.
- Communication workflow.
- Calendar foundation.
- Activity history.
- Passport foundation.

Current focus:

- Validate V1 flows.
- Complete QA.
- Prepare staging.
- Prepare beta.

---

# Product Domains

## Booking Core

Responsible for booking requests, conversations, states, Holds, confirmations and history.

Commercial decisions belong to users.

## Communication

Responsible for inbound messages, outbound messages, delivery states and conversation context.

Communication updates workflow but does not decide outcomes.

## Calendar

Responsible for confirmed bookings, Holds and availability context.

Calendar reflects decisions.

## Activity

Responsible for audit history and operational events.

## Passport

Professional identity layer.

Contains artist presentation, milestones, professional history and selected media.

## CUE ID

Future identity layer.

Potential scope:

- Avatar.
- 3D experience.
- Personalization.

CUE ID is not required for V1.

---

# Core Rules

## Human Commercial Control

Cuebooker assists users.

Cuebooker does not replace commercial decisions.

Never automate:

- Booking confirmation.
- Booking rejection.
- Cancellation.
- Fee acceptance.
- Negotiation.

## Automation Principles

Allowed:

- Organize information.
- Classify activity.
- Detect changes.
- Suggest actions.
- Manage operational workflows.

Forbidden:

- Making commercial decisions.

---

# Users

## Artist

Manages personal bookings and professional identity.

## Manager / Agency

Manages artists, workflows and permissions.

## Promoter

Requests bookings and communicates through secure flows.

---

# Business Model

Plans:

- Free.
- Artist Pro.
- Agency.

Free allows users to experience the core workflow.

Pro expands professional identity, assistance and capacity.

Agency supports multiartist workflows.

---

# Current Priorities

Now:

1. Validate V1.
2. Finish QA.
3. Prepare staging.
4. Prepare beta.

Later:

- Advanced CUE ID.
- 3D editor.
- External integrations.
- Agency expansion.

---

# Documentation Authority

This document defines product direction.

Detailed documents define implementation areas.

Archived documents provide historical context.

When documents conflict, this document has priority.
