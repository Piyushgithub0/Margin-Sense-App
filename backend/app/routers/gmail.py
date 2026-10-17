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


from fastapi.responses import HTMLResponse
from app.config import settings

@router.get("/auth-url")
def get_auth_url_endpoint(redirect_uri: Optional[str] = Query(None)):
    """Returns Google OAuth2 authorization URL configured with GOOGLE_CLIENT_ID."""
    actual_redirect = redirect_uri or settings.GOOGLE_REDIRECT_URI
    url = get_google_auth_url(redirect_uri=actual_redirect)
    return {
        "auth_url": url,
        "redirect_uri": actual_redirect,
        "client_id": settings.GOOGLE_CLIENT_ID,
    }


@router.get("/oauth2callback", response_class=HTMLResponse)
async def oauth2_callback_endpoint(code: str = Query(...), state: Optional[str] = Query(None)):
    """OAuth2 callback handler to exchange authorization code for tokens."""
    res = await exchange_google_code(code)
    if not res.get("success"):
        return HTMLResponse(
            status_code=400,
            content="""
            <html>
            <body style="font-family: sans-serif; background: #0A0F1D; color: #FFF; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
                <div style="background: #111827; padding: 32px; border-radius: 16px; border: 1px solid #EF4444; text-align: center; max-width: 400px;">
                    <h2 style="color: #EF4444; margin-top: 0;">Authentication Failed</h2>
                    <p style="color: #9CA3AF; font-size: 14px;">Could not exchange code with Google OAuth servers. Check client credentials in backend.</p>
                </div>
            </body>
            </html>
            """
        )
    return HTMLResponse(
        content="""
        <html>
        <body style="font-family: sans-serif; background: #0A0F1D; color: #FFF; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
            <div style="background: #111827; padding: 32px; border-radius: 16px; border: 1px solid #22C55E; text-align: center; max-width: 400px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                <div style="font-size: 48px; margin-bottom: 12px;">✅</div>
                <h2 style="color: #22C55E; margin: 0 0 8px;">Google Linked!</h2>
                <p style="color: #D1D5DB; font-size: 15px; margin-bottom: 20px;">
                    MarginSense AI has connected to your Google account for autonomous invoice auditing & Gmail dispute dispatches.
                </p>
                <p style="color: #9CA3AF; font-size: 13px;">You can now close this tab and return to the app.</p>
            </div>
        </body>
        </html>
        """
    )


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
