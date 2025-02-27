import moment from 'moment';

export default function formatTransactionDate(dateValue: any): string {
  if (!dateValue) return ''; // Handle missing dates

  // If Firestore Timestamp, convert to JavaScript Date
  if (typeof dateValue.toDate === 'function') {
    return moment(dateValue.toDate()).format('YYYY-MM-DD');
  }

  // If date is a string in "dddd, MMMM D, YYYY h:mm A" format
  if (typeof dateValue === 'string') {
    return moment(dateValue, 'dddd, MMMM D, YYYY h:mm A').format('YYYY-MM-DD');
  }

  return ''; // Return empty string for unknown formats
}
