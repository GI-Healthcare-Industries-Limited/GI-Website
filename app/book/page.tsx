import type { Metadata } from "next";
import { InterviewBookingForm } from "./booking-form";
export const metadata: Metadata = {
  title: "Book a meeting | GI Healthcare",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};
export default function BookingPage() {
  return <InterviewBookingForm />;
}
