# n8n Daily Lead Operator Example

This folder documents a future n8n-ready workflow. n8n is not required for Sprint 1.

## Intended Flow

Schedule trigger -> HTTP/RSS source checks -> deterministic scoring placeholder -> approval queue artifact -> daily summary notification.

## Safety

- No messages are sent automatically.
- No login-required scraping.
- No paid API is required.
- Daniel approves outreach before sending.
