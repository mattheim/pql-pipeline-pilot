

# PQL-to-Meeting Pipeline — Approval Command Center

## Overview
Build a **PQL Approval Dashboard** in Lovable that ingests CSV data, sends it to your local AI agents API for processing, and presents enriched PQLs with AI-generated emails for human review, editing, and one-click sending via Resend.

---

## 1. CSV Upload & PQL Ingestion
- **CSV Upload Page**: A clean upload interface where users drag-and-drop or select a CSV file with PQL data (id, email, company_name, product_usage_score, last_active_date, etc.)
- **Column Mapping Preview**: After upload, display a preview table of the parsed data so users can confirm the columns are mapped correctly
- **Send to Agents**: A "Process PQLs" button that sends the parsed data to your local AI agents API for qualification
- PQL records are saved to Supabase with an initial status of `pending`

## 2. Supabase Data Model
- **pqls** table: stores each PQL with fields for all CSV columns plus `status` (pending → qualified → enriched → approved → sent → rejected), timestamps, and agent metadata
- **enrichments** table: stores enriched company info and additional contacts returned by your enrichment agent
- **email_drafts** table: stores AI-generated email subject, body, proposed offer, and the target contact info for each PQL
- **activity_log** table: tracks each agent action and human decision for auditability and future feedback loops

## 3. Agent Integration (Your Local API)
- The Lovable app will call your local API endpoints at each stage:
  - **Qualification**: POST PQL data → receive qualification result (Nurture Ready / Not Ready)
  - **Enrichment**: POST qualified PQLs → receive company info, key contacts
  - **Offer Generation**: POST enriched data → receive personalized email draft, subject line, and offer
- Results from each agent call are saved back to Supabase, updating PQL status and populating the enrichments/email_drafts tables
- A pipeline status indicator shows progress as PQLs move through each agent stage

## 4. Approval Dashboard (Main View)
- **Pipeline Overview**: Summary cards showing counts by status (Pending, Qualified, Enriched, Ready for Review, Sent, Rejected)
- **Review Queue**: A list/table of PQLs in "Ready for Review" status, showing company name, usage score, last active date, and proposed offer at a glance
- **Detail Panel**: Clicking a PQL opens a detailed view with:
  - Enriched company information and key contacts
  - AI-generated email preview (subject + body) in an editable rich text area
  - Proposed offer displayed clearly with option to modify
  - AI reasoning/rationale for why this PQL was qualified and what offer was chosen
  - **"Approve & Send"** button — sends the email via Resend and updates status to `sent`
  - **"Reject"** button — marks PQL as `not_ready` with optional rejection reason

## 5. Email Sending via Resend
- A Supabase Edge Function that receives the approved email (to, subject, body, from) and sends it using the Resend API
- The Resend API key will be stored as a Supabase secret
- Success/failure status is logged in the activity_log table

## 6. Design & UX
- Clean, professional dashboard design with a sidebar navigation
- Status-colored badges for PQL pipeline stages
- Toast notifications for actions (sent, rejected, errors)
- Responsive layout optimized for desktop use
- Dark/light mode support

