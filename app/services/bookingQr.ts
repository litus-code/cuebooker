import qrcode from 'qrcode-generator'

export function createBookingQrSvg(value: string) {
  const qr = qrcode(0, 'M')
  qr.addData(value)
  qr.make()
  return qr.createSvgTag({
    cellSize: 5,
    margin: 4,
    scalable: true
  })
}
