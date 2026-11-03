import type { ApplicationStatus } from "../types";

const styles: Record<ApplicationStatus, string> = {
  Pending: "badge badge-pending",
  Approved: "badge badge-approved",
  Rejected: "badge badge-rejected",
};

export default function StatusBadge({ status }: { status: ApplicationStatus }) {
  return <span className={styles[status] ?? "badge"}>{status}</span>;
}
