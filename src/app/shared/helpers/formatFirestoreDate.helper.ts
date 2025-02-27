import moment from "moment";

export default function formatFirestoreDate(dateValue: any): string | null {
    if (!dateValue) return null;

    let formattedDate: string | null = null;

    // If Firestore Timestamp, convert to JavaScript Date
    if (typeof dateValue.toDate === 'function') {
        formattedDate = moment(dateValue.toDate()).format('LLLL');
    }

    // If already a string (e.g., "Wednesday, February 26, 2025 12:00 AM"), parse it
    if (typeof dateValue === 'string') {
        formattedDate = moment(dateValue, 'dddd, MMMM D, YYYY hh:mm A').format('LLLL');
    }

    // Remove the time (e.g., "12:00 AM") by splitting and taking only the date part
    return formattedDate ? formattedDate.replace(/\d{1,2}:\d{2} (AM|PM)/, '').trim() : null;
}
