export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency,
    minimumFractionDigits: 0, maximumFractionDigits: 2
  }).format(amount);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
};

export const formatShortDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short'
  });
};

export const getMonthName = (month) => {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return months[month];
};

export const categoryColors = [
  '#f97316','#8b5cf6','#06b6d4','#ec4899','#eab308',
  '#ef4444','#a855f7','#3b82f6','#10b981','#14b8a6','#22c55e','#6b7280'
];
