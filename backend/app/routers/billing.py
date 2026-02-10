from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Response

from app.schemas import ChargeRequest, ChargeResponse
from app.store import customers_by_id, invoice_pdf_by_id, invoices_by_id

router = APIRouter(prefix="/billing", tags=["billing"])


def _build_simple_pdf(content: str) -> bytes:
    escaped = content.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
    stream = f"BT /F1 12 Tf 50 760 Td ({escaped}) Tj ET"

    obj1 = "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
    obj2 = "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
    obj3 = (
        "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        "/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n"
    )
    obj4 = "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n"
    obj5 = f"5 0 obj << /Length {len(stream)} >> stream\n{stream}\nendstream endobj\n"

    objects = [obj1, obj2, obj3, obj4, obj5]
    pdf = "%PDF-1.4\n"
    offsets = []
    for obj in objects:
        offsets.append(len(pdf.encode("latin-1")))
        pdf += obj

    xref_start = len(pdf.encode("latin-1"))
    pdf += f"xref\n0 {len(objects) + 1}\n"
    pdf += "0000000000 65535 f \n"
    for off in offsets:
        pdf += f"{off:010d} 00000 n \n"
    pdf += (
        f"trailer << /Size {len(objects) + 1} /Root 1 0 R >>\n"
        f"startxref\n{xref_start}\n%%EOF"
    )
    return pdf.encode("latin-1")


@router.post("/charge", response_model=ChargeResponse)
def charge_sale(payload: ChargeRequest) -> ChargeResponse:
    if payload.payment_method not in {"cash", "card", "customer_account"}:
        raise HTTPException(status_code=400, detail="Método de pago inválido")

    if not payload.items:
        raise HTTPException(status_code=400, detail="No hay items para cobrar")

    total = round(sum(item.quantity * item.unit_price for item in payload.items), 2)

    if payload.payment_method == "customer_account":
        if not payload.customer_id:
            raise HTTPException(status_code=400, detail="Falta customer_id para cuenta corriente")
        customer = customers_by_id.get(payload.customer_id)
        if not customer:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
        customer.debt_balance += total
        customers_by_id[customer.id] = customer

    # Simulación de procedimiento ARCA (token + autorización + CAE)
    invoice_id = str(uuid4())
    invoice_number = f"FA-{datetime.utcnow().strftime('%Y%m%d')}-{invoice_id[:8]}"
    cae = str(70000000000000 + int(invoice_id[:6], 16) % 9999999)

    pdf_text = (
        f"Factura {invoice_number} | CAE {cae} | Total {total:.2f} | "
        f"Pago {payload.payment_method} | Fecha {datetime.utcnow().isoformat()}"
    )
    pdf_bytes = _build_simple_pdf(pdf_text)

    invoices_by_id[invoice_id] = {
        "invoice_number": invoice_number,
        "cae": cae,
        "total": total,
        "payment_method": payload.payment_method,
        "arca_status": "approved",
    }
    invoice_pdf_by_id[invoice_id] = pdf_bytes

    return ChargeResponse(
        invoice_id=invoice_id,
        invoice_number=invoice_number,
        cae=cae,
        total=total,
        pdf_url=f"/billing/invoices/{invoice_id}.pdf",
        arca_status="approved",
    )


@router.get("/invoices/{invoice_id}.pdf")
def download_invoice_pdf(invoice_id: str) -> Response:
    pdf_content = invoice_pdf_by_id.get(invoice_id)
    if not pdf_content:
        raise HTTPException(status_code=404, detail="Factura no encontrada")

    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="factura-{invoice_id}.pdf"'},
    )
