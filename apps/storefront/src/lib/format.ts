export function formatCurrency(amount: number): string {
  // Add a check to prevent errors if the input is not a valid number
  if (typeof amount !== 'number') {
    return '$0.00';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}


export function formatDate(dateInput: string | number | Date): string {
  // Explicitly check for null or undefined to prevent new Date(null) issues
  if (dateInput === null || dateInput === undefined) {
    return 'Invalid Date';
  }

  try {
    const date = new Date(dateInput);
    // Check if the resulting date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Date formatting failed:', error);
    return 'Invalid Date';
  }
}

