const failures: Record<string, { status: number; message: string }> = {
  "merchant-environment-unverified": { status: 503, message: "No pudimos comprobar si la cuenta vendedora es de prueba. Tu compra sigue guardada; debemos revisar la integración." },
  "merchant-mode-mismatch": { status: 503, message: "La cuenta vendedora configurada no corresponde al modo de la tienda. Debemos revisar las credenciales; no necesitas volver a pagar." },
  "payment-provider-auth": { status: 503, message: "Mercado Pago no permite consultar el pago con las credenciales del servidor. Debemos revisar la configuración del vendedor." },
  "payment-provider-not-found": { status: 404, message: "Mercado Pago no encontró esta operación con el vendedor configurado. Tu compra sigue guardada; no necesitas volver a pagar." },
  "payment-provider-busy": { status: 503, message: "Mercado Pago está limitando las consultas. Intenta actualizar el estado dentro de un minuto." },
  "payment-provider-request": { status: 502, message: "Mercado Pago rechazó la consulta de esta operación. Debemos revisar la integración del servidor." },
  "payment-provider-failed": { status: 502, message: "No pudimos conectar con Mercado Pago. Tu compra sigue guardada; vuelve a actualizar el estado en un momento." },
  "payment-mismatch-seller": { status: 409, message: "El vendedor del pago no coincide con el configurado en la web. Debemos revisar la configuración del servidor." },
  "payment-mismatch-environment": { status: 409, message: "El entorno que informa Mercado Pago para este pago no coincide con el modo de prueba configurado. Debemos revisar la integración; no necesitas volver a pagar." },
  "payment-mismatch-currency": { status: 409, message: "La moneda del pago no coincide con la moneda guardada en esta compra." },
  "payment-mismatch-amount": { status: 409, message: "El importe del pago no coincide con el importe guardado en esta compra." },
  "payment-mismatch": { status: 409, message: "Los datos de la operación no coinciden con esta compra. No se han acreditado stickers con ese pago." },
  "invalid-payment": { status: 502, message: "Mercado Pago devolvió una operación que no pudimos validar." },
  "verification-failed": { status: 500, message: "La comprobación falló en el servidor. Tu compra sigue guardada y debemos revisar la integración." },
};

export function paymentFailureInfo(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  return Object.prototype.hasOwnProperty.call(failures, code) ? { code, ...failures[code] } : null;
}

export function providerFailureCode(status: number) {
  return status === 401 || status === 403 ? "payment-provider-auth"
    : status === 404 ? "payment-provider-not-found"
    : status === 429 ? "payment-provider-busy"
    : status >= 400 && status < 500 ? "payment-provider-request" : "payment-provider-failed";
}
