import io
import qrcode
from PIL import Image
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import landscape, letter
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from django.utils import timezone

def generate_ticket_pdf(ticket):
    """
    Generates a single-page, beautifully styled high-resolution PDF ticket pass 
    with QR code, collegiate header, student metadata, and verification seal.
    """
    buffer = io.BytesIO()
    
    # Crisp Landscape Card Size (640 x 320 pt)
    card_width = 640
    card_height = 320
    
    p = canvas.Canvas(buffer, pagesize=(card_width, card_height))
    p.setTitle(f"SKYVENT_Pass_{ticket.ticket_number}")
    p.setAuthor("SKYVENT Student Org Hub")
    
    # Color Palette
    c_bg = HexColor("#FAF8F5")
    c_primary = HexColor("#6B4A38")
    c_dark = HexColor("#2A1E18")
    c_muted = HexColor("#7A6A5E")
    c_border = HexColor("#E8DCCE")
    c_white = HexColor("#FFFFFF")
    c_accent = HexColor("#8B6353")
    c_emerald = HexColor("#047857")
    c_gold = HexColor("#D97706")
    
    # 1. Background Fill
    p.setFillColor(c_bg)
    p.rect(0, 0, card_width, card_height, fill=1, stroke=0)
    
    # 2. Outer Card Border with rounded corners
    p.setStrokeColor(c_border)
    p.setLineWidth(1.5)
    p.roundRect(14, 14, card_width - 28, card_height - 28, 12, fill=0, stroke=1)
    
    # 3. Header Top Bar
    p.setFillColor(c_primary)
    p.rect(14, card_height - 60, card_width - 28, 46, fill=1, stroke=0)
    
    # Header Branding & Logo Monogram
    p.setFillColor(c_white)
    p.setFont("Helvetica-Bold", 17)
    p.drawString(32, card_height - 40, "SKYVENT")
    p.setFont("Helvetica", 9)
    p.drawString(124, card_height - 38, "|  OFFICIAL STUDENT PASS")
    
    # Pass Type Badge on Header Right
    p.setFillColor(c_accent)
    p.roundRect(card_width - 165, card_height - 48, 140, 22, 5, fill=1, stroke=0)
    p.setFillColor(c_white)
    p.setFont("Helvetica-Bold", 8.5)
    pass_type_str = f"{ticket.ticket_type} ADMISSION"
    p.drawCentredString(card_width - 95, card_height - 42, pass_type_str)
    
    # 4. Perforated Stub Divider Line (before QR section on right)
    stub_x = card_width - 185
    p.setStrokeColor(c_border)
    p.setLineWidth(1)
    p.setDash(4, 4)
    p.line(stub_x, 14, stub_x, card_height - 60)
    p.setDash() # reset dash
    
    # 5. Left Content - Event & Attendee Details
    event = ticket.event
    user = ticket.user
    
    # Event Title
    p.setFillColor(c_dark)
    p.setFont("Helvetica-Bold", 15)
    event_title = event.title if event else "Campus Event"
    if len(event_title) > 36:
        event_title = event_title[:33] + "..."
    p.drawString(32, card_height - 90, event_title)
    
    # Row 1: Venue & Date
    p.setFillColor(c_muted)
    p.setFont("Helvetica-Bold", 7.5)
    p.drawString(32, card_height - 118, "VENUE LOCATION")
    p.drawString(235, card_height - 118, "DATE & TIME")
    
    p.setFillColor(c_dark)
    p.setFont("Helvetica", 9.5)
    venue_str = event.venue if event else "Campus Venue"
    if len(venue_str) > 26:
        venue_str = venue_str[:23] + "..."
    p.drawString(32, card_height - 132, venue_str)
    
    if event and event.start_datetime:
        date_str = timezone.localtime(event.start_datetime).strftime("%a, %b %d, %Y • %I:%M %p")
    else:
        date_str = "Scheduled Date"
    p.drawString(235, card_height - 132, date_str)
    
    # Row 2: Attendee Name & Email / Student ID
    p.setFillColor(c_muted)
    p.setFont("Helvetica-Bold", 7.5)
    p.drawString(32, card_height - 158, "ATTENDEE NAME")
    p.drawString(235, card_height - 158, "STUDENT ID / EMAIL")
    
    p.setFillColor(c_dark)
    p.setFont("Helvetica-Bold", 10)
    p.drawString(32, card_height - 172, user.name if user else "Student Member")
    
    p.setFillColor(c_dark)
    p.setFont("Helvetica", 9.5)
    student_id_str = f"{user.student_id} ({user.email})" if user and user.student_id else (user.email if user else "")
    if len(student_id_str) > 30:
        student_id_str = student_id_str[:27] + "..."
    p.drawString(235, card_height - 172, student_id_str)
    
    # Row 3: Ticket Number & Price Status
    p.setFillColor(c_muted)
    p.setFont("Helvetica-Bold", 7.5)
    p.drawString(32, card_height - 198, "TICKET NUMBER")
    p.drawString(235, card_height - 198, "PAYMENT STATUS")
    
    p.setFillColor(c_primary)
    p.setFont("Courier-Bold", 11)
    p.drawString(32, card_height - 213, f"#{ticket.ticket_number}")
    
    p.setFillColor(c_emerald if ticket.status in ['CONFIRMED', 'USED'] else c_dark)
    p.setFont("Helvetica-Bold", 9.5)
    price_val = float(ticket.price or 0)
    status_label = f"₹{price_val:.2f} ({ticket.status})" if price_val > 0 else f"FREE PASS ({ticket.status})"
    p.drawString(235, card_height - 213, status_label)
    
    # 6. Verification Notice Bar at bottom left
    p.setFillColor(c_white)
    p.roundRect(32, 26, stub_x - 56, 32, 6, fill=1, stroke=0)
    p.setStrokeColor(c_border)
    p.setLineWidth(0.8)
    p.roundRect(32, 26, stub_x - 56, 32, 6, fill=0, stroke=1)
    
    p.setFillColor(c_muted)
    p.setFont("Helvetica", 7.5)
    p.drawString(42, 44, "• Present this digital QR pass along with your student ID at event check-in.")
    p.drawString(42, 32, f"• Verified by SKYVENT System on {timezone.localtime(timezone.now()).strftime('%b %d, %Y %I:%M %p')}.")
    
    # 7. Right Stub: Clean QR Code Section
    qr_data = ticket.qr_token or f"SKYVENT-TKT-{ticket.id}-{ticket.ticket_number}"
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=4,
        border=1,
    )
    qr.add_data(qr_data)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="#2A1E18", back_color="#FFFFFF")
    
    qr_buffer = io.BytesIO()
    qr_img.save(qr_buffer, format='PNG')
    qr_buffer.seek(0)
    
    qr_size = 125
    qr_x = stub_x + (card_width - stub_x - qr_size) / 2
    qr_y = 75
    p.drawImage(ImageReader(qr_buffer), qr_x, qr_y, width=qr_size, height=qr_size)
    
    # QR instructions & token
    p.setFillColor(c_dark)
    p.setFont("Helvetica-Bold", 8.5)
    p.drawCentredString(stub_x + (card_width - stub_x) / 2, 54, "SCAN FOR ENTRY")
    
    p.setFillColor(c_muted)
    p.setFont("Courier", 7)
    token_preview = ticket.qr_token[:18] + "..." if ticket.qr_token and len(ticket.qr_token) > 18 else (ticket.qr_token or "")
    p.drawCentredString(stub_x + (card_width - stub_x) / 2, 38, token_preview)
    
    # Save document - save() cleanly closes the single page without adding duplicate pages
    p.save()
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
