import logging
from typing import Optional, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from fastapi.responses import HTMLResponse

from app.config import settings
from app.services.gmail_imap_service import (
    sync_gmail_imap,
    get_inbox_items,
    audit_specific_item,
    send_dispute_smtp,
    get_sync_status,
)

router = APIRouter(prefix="/api/gmail", tags=["Gmail IMAP & Google SMTP Invoice Inbox"])
logger = logging.getLogger("MarginSense.GmailRouter")


class SendDisputeRequest(BaseModel):
    email_id: Optional[str] = None
    to_email: str
    subject: str
    body: str


class AnalyseEmailRequest(BaseModel):
    email_id: str


@router.get("/status")
def get_status_endpoint():
    """Returns real-time Gmail IMAP & SMTP sync status."""
    return get_sync_status()


@router.post("/sync-now")
def sync_now_endpoint(background_tasks: BackgroundTasks):
    """
    Triggers an immediate scan of Gmail IMAP inbox.
    Extracts PDF/image attachments, runs OCR, and detects profit leaks.
    """
    result = sync_gmail_imap(max_count=15)
    return result


@router.get("/inbox")
def get_inbox_endpoint():
    """
    Returns recent Gmail messages containing PDF invoices.
    Directly and autonomously analyzes newly received invoices (is_new=True).
    Leaves older invoices unaudited until specifically selected by the user.
    """
    inbox = get_inbox_items(auto_audit_new=True)
    new_invoices_count = sum(1 for m in inbox if m.get("is_new") and m.get("analysis_status") == "AUDITED")
    total_leaks_found = sum(m.get("disputed_amount", 0.0) for m in inbox if m.get("analysis_status") == "AUDITED")

    return {
        "success": True,
        "new_invoices_count": new_invoices_count,
        "total_leaks_at_risk": round(total_leaks_found, 2),
        "inbox": inbox
    }


@router.post("/analyse")
def analyse_specific_email_endpoint(payload: AnalyseEmailRequest):
    """
    Specifically analyzes an older or un-audited invoice selected by the user.
    """
    updated_msg = audit_specific_item(payload.email_id)
    if not updated_msg:
        raise HTTPException(status_code=404, detail="Email not found")

    logger.info(f"[GmailRouter] Analyzed invoice from email {payload.email_id}: {updated_msg.get('sender_name')}")
    return {
        "success": True,
        "email": updated_msg
    }


@router.post("/send-dispute")
async def send_dispute_endpoint(payload: SendDisputeRequest):
    """
    Sends the generated dispute response to the supplier via Google SMTP.
    """
    if not payload.to_email or not payload.body:
        raise HTTPException(status_code=400, detail="Recipient email and body are required")

    result = await send_dispute_smtp(
        to_email=payload.to_email,
        subject=payload.subject,
        body=payload.body,
        email_id=payload.email_id
    )

    return result
