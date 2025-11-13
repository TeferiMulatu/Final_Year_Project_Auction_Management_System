export function formatCurrency(amount) {
  const val = Number(amount || 0)
  // Use fixed two decimals and Br prefix
  return ` ${val.toFixed(2)} Br`
}

export default formatCurrency
