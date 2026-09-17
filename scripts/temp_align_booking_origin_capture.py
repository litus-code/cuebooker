from pathlib import Path

path = Path('app/services/bookingCoreApi.ts')
text = path.read_text()

old_select = "select: 'id,workspace_id,artist_id,primary_contact_id,counterparty_id,source,status,event_name,venue_name,city,country_code,event_date,start_time,end_time,event_timezone,offer_amount_minor,currency,fee_basis,archived_at,created_by,created_at,updated_at',"
new_select = "select: 'id,workspace_id,artist_id,primary_contact_id,counterparty_id,source,origin_channel,capture_method,status,event_name,venue_name,city,country_code,event_date,start_time,end_time,event_timezone,offer_amount_minor,currency,fee_basis,archived_at,created_by,created_at,updated_at',"
if old_select not in text and new_select not in text:
    raise SystemExit('booking select anchor missing')
text = text.replace(old_select, new_select, 1)

old_body = """        source: input.source,\n        status: input.status || 'new',"""
new_body = """        source: input.source,\n        ...(input.originChannel ? { origin_channel: input.originChannel } : {}),\n        ...(input.captureMethod ? { capture_method: input.captureMethod } : {}),\n        status: input.status || 'new',"""
if old_body not in text and new_body not in text:
    raise SystemExit('create booking body anchor missing')
text = text.replace(old_body, new_body, 1)

path.write_text(text)
