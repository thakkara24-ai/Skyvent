import io
import qrcode
from PIL import Image
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import landscape, letter
from reportlab.pdfgen import canvas
from django.utils import timezone

def generate_ticket_pdf(ticket):
    """
    Generates a beautifully styled, high-resolution PDF ticket pass with QR code,
    warm academic color palette, and digital verification credentials.
    Returns bytes of the generated PDF document.
    """
    buffer = io.BytesIO()
    
    # Custom ticket pass size (landscape 620 x 300 pt)
    card_width = 620
    card_height = 300
    
    p = canvas.Canvas(buffer, pagesize=(card_width, card_height))
    p.setTitle(f"SKYVENT_Ticket_{ticket.ticket_number}")
    
    # Colors
    c_bg = HexColor("#FAF8F5")
    c_primary = HexColor("#6B4A38")
    c_dark = HexColor("#2A1E18")
    c_muted = HexColor("#7A6A5E")
    c_border = HexColor("#E8DCCE")
    c_white = HexColor("#FFFFFF")
    c_accent = HexColor("#8B6353")
    c_emerald = HexColor("#047857")
    
    # Draw Background
    p.setFillColor(c_bg)
    p.rect(0, 0, card_width, card_height, fill=1, stroke=0)
    
    # Draw Outer Border with rounded corners effect
    p.setStrokeColor(c_border)
    p.setLineWidth(1.5)
    p.roundRect(15, 15, card_width - 30, card_height - 30, 10, fill=0, stroke=1)
    
    # Draw Header Top Bar
    p.setFillColor(c_primary)
    p.rect(15, card_height - 55, card_width - 30, 40, fill=1, stroke=0)
    
    # Header Branding
    p.setFillColor(c_white)
    p.setFont("Helvetica-Bold", 16)
    p.drawString(30, card_height - 38, "SKYVENT")
    p.setFont("Helvetica", 9)
    p.drawString(115, card_height - 36, "|   OFFICIAL CAMPUS EVENT PASS")
    
    # Pass Type Badge on top right of header
    p.setFillColor(c_white)
    p.setFont("Helvetica-Bold", 9)
    pass_type_str = f"PASS: {ticket.ticket_type}"
    p.drawRightString(card_width - 30, card_height - 37, pass_type_str)
    
    # Event Title
    p.setFillColor(c_dark)
    p.setFont("Helvetica-Bold", 16)
    event_title = ticket.event.title
    if len(event_title) > 36:
        event_title = event_title[:33] + "..."
    p.drawString(30, card_height - 85, event_title)
    
    # Perforated Stub Divider Line (before QR section on right)
    stub_x = card_width - 180
    p.setStrokeColor(c_border)
    p.setLineWidth(1)
    p.setDash(4, 4)
    p.line(stub_x, 15, stub_x, card_height - 55)
    p.setDash() # reset dash
    
    # Left Content - Event Details Grid
    event = ticket.event
    user = ticket.user
    
    # Row 1: Venue & Date
    p.setFillColor(c_muted)
    p.setFont("Helvetica-Bold", 8)
    p.drawString(30, card_height - 110, "VENUE LOCATION")
    p.drawString(220, card_height - 110, "DATE & TIME")
    
    p.setFillColor(c_dark)
    p.setFont("Helvetica", 10)
    venue_str = event.venue
    if len(venue_str) > 26:
        venue_str = venue_str[:23] + "..."
    p.drawString(30, card_height - 124, venue_str)
    
    date_str = timezone.localtime(event.start_datetime).strftime("%b %d, %Y • %I:%M %p")
    p.drawString(220, card_height - 124, date_str)
    
    # Row 2: Attendee Name & Email
    p.setFillColor(c_muted)
    p.setFont("Helvetica-Bold", 8)
    p.drawString(30, card_height - 150, "ATTENDEE NAME")
    p.drawString(220, card_height - 150, "STUDENT EMAIL / ID")
    
    p.setFillColor(c_dark)
    p.setFont("Helvetica-Bold", 10)
    p.drawString(30, card_height - 164, user.name)
    
    p.setFillColor(c_dark)
    p.setFont("Helvetica", 10)
    attendee_id_str = user.email
    if len(attendee_id_str) > 28:
        attendee_id_str = attendee_id_str[:25] + "..."
    p.drawString(220, card_height - 164, attendee_id_str)
    
    # Row 3: Ticket Number & Price
    p.setFillColor(c_muted)
    p.setFont("Helvetica-Bold", 8)
    p.drawString(30, card_height - 190, "TICKET NUMBER")
    p.drawString(220, card_height - 190, "AMOUNT PAID / STATUS")
    
    p.setFillColor(c_primary)
    p.setFont("Courier-Bold", 11)
    p.drawString(30, card_height - 205, f"#{ticket.ticket_number}")
    
    p.setFillColor(c_emerald if ticket.status == 'CONFIRMED' else c_dark)
    p.setFont("Helvetica-Bold", 10)
    price_val = float(ticket.price)
    status_label = f"₹{price_val:.2f} ({ticket.status})" if price_val > 0 else f"FREE PASS ({ticket.status})"
    p.drawString(220, card_height - 205, status_label)
    
    # Footer Notice Bar on Left
    p.setFillColor(c_white)
    p.roundRect(30, 26, stub_x - 50, 32, 6, fill=1, stroke=0)
    p.setStrokeColor(c_border)
    p.setLineWidth(0.8)
    p.roundRect(30, 26, stub_x - 50, 32, 6, fill=0, stroke=1)
    
    p.setFillColor(c_muted)
    p.setFont("Helvetica", 7.5)
    p.drawString(40, 44, "• Present this digital or printed pass along with your student ID at event check-in.")
    p.drawString(40, 32, f"• Generated securely by SKYVENT System on {timezone.localtime(timezone.now()).strftime('%b %d, %Y %I:%M %p')}.")
    
    # Right Side: QR Code Section
    qr_data = ticket.qr_token or f"SKYVENT-TKT-{ticket.id}-{ticket.ticket_number}"
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=4,
        border=2,
    )
    qr.add_data(qr_data)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="#2A1E18", back_color="#FFFFFF")
    
    qr_buffer = io.BytesIO()
    qr_img.save(qr_buffer, format='PNG')
    qr_buffer.seek(0)
    
    # Draw QR Code
    qr_size = 120
    qr_x = stub_x + (card_width - stub_x - qr_size) / 2
    qr_y = 65
    p.drawImage(reportlab_image_reader(qr_buffer), qr_x, qr_y, width=qr_size, height=qr_size)
    
    # QR instructions
    p.setFillColor(c_dark)
    p.setFont("Helvetica-Bold", 8)
    p.drawCentredString(stub_x + (card_width - stub_x) / 2, 48, "SCAN FOR ENTRY")
    
    p.setFillColor(c_muted)
    p.setFont("Courier", 7)
    token_preview = ticket.qr_token[:16] + "..." if len(ticket.qr_token) > 16 else ticket.qr_token
    p.drawCentredString(stub_x + (card_width - stub_x) / 2, 35, token_preview)
    
    p.showPage()
    p.save()
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


def reportlab_image_reader(image_stream):
    """Helper to convert BytesIO image stream for ReportLab drawImage"""
    from reportlab.lib.utils import ImageReader
    return ImageReader(image_stream)
