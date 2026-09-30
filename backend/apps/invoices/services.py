from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string


def fmt_inr(value):
    """Format a number with Indian digit grouping, e.g. 12,34,567.00."""
    try:
        amount = float(value or 0)
    except (TypeError, ValueError):
        amount = 0.0
    s = f"{amount:.2f}"
    negative = s.startswith('-')
    if negative:
        s = s[1:]
    integer_part, _, frac = s.partition('.')
    if len(integer_part) > 3:
        head, tail = integer_part[:-3], integer_part[-3:]
        groups = []
        while len(head) > 2:
            groups.insert(0, head[-2:])
            head = head[:-2]
        if head:
            groups.insert(0, head)
        integer_part = ','.join(groups) + ',' + tail
    result = f"{integer_part}.{frac}"
    return '-' + result if negative else result


def fmt_date(value):
    """Format a date like 03-Sep-2026."""
    if not value:
        return ''
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    try:
        return f"{value.day:02d}-{months[value.month - 1]}-{value.year}"
    except (AttributeError, IndexError, TypeError):
        return str(value or '')


def num_to_words(num):
    """Convert a number (rounded) into Indian English words, e.g. 15000 -> Fifteen Thousand."""
    n = int(round(float(num or 0)))
    if n == 0:
        return 'Zero'

    ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
            'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
    tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

    def under_1000(val):
        out = ''
        if val >= 100:
            out += ones[val // 100] + ' Hundred'
            val %= 100
            if val:
                out += ' '
        if val >= 20:
            out += tens[val // 10]
            if val % 10:
                out += ' ' + ones[val % 10]
        elif val:
            out += ones[val]
        return out

    def convert(val):
        out = ''
        if val >= 10000000:
            out += convert(val // 10000000) + ' Crore'
            val %= 10000000
            if val:
                out += ' '
        if val >= 100000:
            out += under_1000(val // 100000) + ' Lakh'
            val %= 100000
            if val:
                out += ' '
        if val >= 1000:
            out += under_1000(val // 1000) + ' Thousand'
            val %= 1000
            if val:
                out += ' '
        if val:
            out += under_1000(val)
        return out

    return convert(n).strip()


def build_invoice_email(invoice, recipient, from_email):
    """Build the HTML invoice email for an Invoice record."""
    items = []
    for it in invoice.items or []:
        quantity = float(it.get('quantity') or 1)
        price = float(it.get('price') or 0)
        discount = float(it.get('discount') or 0)
        amount = (price * quantity) - discount
        items.append({
            'name': it.get('name') or '',
            'quantity': quantity,
            'rate': fmt_inr(price),
            'amount': fmt_inr(amount),
        })

    context = {
        'invoice_id': invoice.invoice_id,
        'invoice_type': invoice.invoice_type or 'Invoice',
        'order_id': invoice.order.order_id,
        'customer': invoice.order.customer or 'Customer',
        'plan_stage': invoice.plan_stage or '',
        'invoice_date': fmt_date(invoice.invoice_date),
        'due_date': fmt_date(invoice.due_date),
        'payment_terms': invoice.payment_terms or '',
        'items': items,
        'subtotal': fmt_inr(invoice.subtotal),
        'discount': fmt_inr(invoice.discount),
        'tax': fmt_inr(invoice.tax),
        'tax_rate': fmt_inr(invoice.tax_rate),
        'total': fmt_inr(invoice.total),
        'total_words': num_to_words(invoice.total) + ' Rupees Only',
        'notes': invoice.notes or '',
        'company_email': 'info@programers.in',
        'company_phone': '9447151442, 9495951442, 9446451442',
        'company_website': 'www.programers.in',
        'company_address': '4th Floor, Park House, Round North, Thrissur, Kerala, India - 680 001',
    }

    html_body = render_to_string('invoices/invoice_email.html', context)

    plain_body = (
        f"Dear {context['customer']},\n\n"
        f"Please find your invoice {invoice.invoice_id} dated {context['invoice_date']}.\n"
        f"Total: {context['total']}\n"
        f"Due: {context['due_date']}\n\n"
        f"For Programers International\n"
        f"{context['company_email']} | {context['company_website']}\n"
    )

    email = EmailMultiAlternatives(
        subject=f'Invoice {invoice.invoice_id} — Programers International',
        body=plain_body,
        from_email=from_email,
        to=[recipient],
    )
    email.attach_alternative(html_body, 'text/html')
    return email