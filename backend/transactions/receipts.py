import io
from django.http import HttpResponse
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT


def generate_receipt_pdf(transaction):
    """
    Generates a professional, branded PDF transaction receipt using ReportLab.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        textColor=colors.HexColor('#0B192C'),
        alignment=TA_CENTER,
        spaceAfter=4
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        textColor=colors.HexColor('#0066FF'),
        alignment=TA_CENTER,
        spaceAfter=15
    )
    tag_style = ParagraphStyle(
        'DocTag',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9,
        textColor=colors.HexColor('#6B7280'),
        alignment=TA_CENTER,
        spaceAfter=15
    )
    body_bold = ParagraphStyle(
        'BodyBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=colors.HexColor('#1E293B')
    )
    body_normal = ParagraphStyle(
        'BodyNormal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor('#334155')
    )
    footer_style = ParagraphStyle(
        'FooterStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        textColor=colors.HexColor('#94A3B8'),
        alignment=TA_CENTER
    )

    elements = []

    # Header
    elements.append(Paragraph("ONLINE BANKING MANAGEMENT SYSTEM", title_style))
    elements.append(Paragraph("OFFICIAL ELECTRONIC TRANSACTION RECEIPT", subtitle_style))
    elements.append(Paragraph("Educational Banking Simulation • Secured Transaction Record", tag_style))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0066FF'), spaceBefore=5, spaceAfter=20))

    # Sender / Receiver Names
    sender_name = "N/A (Cash / External Deposit)"
    sender_acc = "N/A"
    if transaction.sender_account:
        sender_name = transaction.sender_account.user.get_full_name() or transaction.sender_account.user.username
        sender_acc = transaction.sender_account.account_number

    receiver_name = "N/A (Cash Withdrawal)"
    receiver_acc = "N/A"
    if transaction.receiver_account:
        receiver_name = transaction.receiver_account.user.get_full_name() or transaction.receiver_account.user.username
        receiver_acc = transaction.receiver_account.account_number

    # Table data
    data = [
        [Paragraph("Transaction ID", body_bold), Paragraph(transaction.transaction_id, body_normal)],
        [Paragraph("Date & Time (UTC)", body_bold), Paragraph(transaction.created_at.strftime('%Y-%m-%d %H:%M:%S'), body_normal)],
        [Paragraph("Transaction Type", body_bold), Paragraph(transaction.get_transaction_type_display(), body_normal)],
        [Paragraph("Amount", body_bold), Paragraph(f"<b>${transaction.amount:,.2f} USD</b>", body_bold)],
        [Paragraph("Status", body_bold), Paragraph(f"<font color='#059669'><b>{transaction.status}</b></font>", body_bold)],
        [Paragraph("Sender Name", body_bold), Paragraph(sender_name, body_normal)],
        [Paragraph("Sender Account", body_bold), Paragraph(sender_acc, body_normal)],
        [Paragraph("Beneficiary Name", body_bold), Paragraph(receiver_name, body_normal)],
        [Paragraph("Beneficiary Account", body_bold), Paragraph(receiver_acc, body_normal)],
        [Paragraph("Remarks / Description", body_bold), Paragraph(transaction.remarks or "None", body_normal)],
    ]

    table = Table(data, colWidths=[180, 350])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.HexColor('#FFFFFF'), colors.HexColor('#F8FAFC')])
    ]))

    elements.append(table)
    elements.append(Spacer(1, 30))

    # Disclaimer & stamp box
    stamp_data = [
        [
            Paragraph("<b>SECURITY VERIFICATION:</b><br/>This simulated transaction was processed through an ACID-compliant atomic transaction engine with row locking. No actual fiat or electronic currency was transferred.", footer_style)
        ]
    ]
    stamp_table = Table(stamp_data, colWidths=[530])
    stamp_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F1F5F9')),
        ('PADDING', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    elements.append(stamp_table)
    elements.append(Spacer(1, 20))
    elements.append(Paragraph("Online Banking Management System • Developed for Demonstration & Academic Evaluation", footer_style))

    doc.build(elements)
    buffer.seek(0)

    response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="Receipt_{transaction.transaction_id}.pdf"'
    return response
