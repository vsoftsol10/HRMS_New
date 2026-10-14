const STYLES = {
  Draft: "bg-gray-100 text-gray-600",
  Issued: "bg-green-100 text-green-700",
  Sent: "bg-blue-100 text-blue-600",
};

export default function CertificateStatusBadge({ status }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
        STYLES[status] || STYLES.Draft
      }`}
    >
      {status}
    </span>
  );
}