import logging
from typing import Optional, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from app.services.gmail_service import (
    get_google_auth_url,
    exchange_google_code,
    get_gmail_inbox_data,
    audit_specific_email,
    send_dispute_email_google_smtp,
)
from app.services.invoice_structurer import extract_regex_fields, audit_profit_leaks

router = APIRouter(prefix="/api/gmail", tags=["Gmail & Google SMTP Invoice Inbox"])
logger = logging.getLogger("MarginSense.GmailRouter")


class SendDisputeRequest(BaseModel):
    email_id: Optional[str] = None
    to_email: str
    subject: str
    body: str


class AnalyseEmailRequest(BaseModel):
    email_id: str


@router.get("/auth-url")
def get_auth_url_endpoint():
    """Returns Google OAuth2 authorization URL configured with GOOGLE_CLIENT_ID."""
    url = get_google_auth_url()
    return {"auth_url": url}


@router.get("/oauth2callback")
async def oauth2_callback_endpoint(code: str = Query(...)):
    """OAuth2 callback handler to exchange authorization code for tokens."""
    res = await exchange_google_code(code)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail="Failed to exchange authorization code")
    return {
        "status": "connected",
        "message": "Google Account linked successfully to MarginSense AI!"
    }


@router.get("/inbox")
def get_inbox_endpoint():
    """
    Returns recent Gmail messages containing PDF invoices.
    Directly and autonomously analyzes newly received invoices (is_new=True).
    Leaves older invoices unaudited until specifically selected by the user.
    """
    inbox = get_gmail_inbox_data(auto_audit_new=True)
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
    updated_msg = audit_specific_email(payload.email_id)
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
    Sends the generated dispute response to the supplier via Google SMTP / Gmail API.
    """
    if not payload.to_email or not payload.body:
        raise HTTPException(status_code=400, detail="Recipient email and body are required")

    result = await send_dispute_email_google_smtp(
        to_email=payload.to_email,
        subject=payload.subject,
        body=payload.body,
        email_id=payload.email_id
    )

    return result
