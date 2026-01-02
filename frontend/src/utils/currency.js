export function formatCurrency(amount) {
  const val = Number(amount || 0)
  // Use fixed two decimals and ETB prefix
  return ` ${val.toFixed(2)} ETB`
}

export default formatCurrency
