import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// Helvetica (the built-in PDF font) has no rupee glyph, so amounts use "Rs."
const formatAmount = (value) => `Rs. ${Number(value).toLocaleString("en-IN")}`;

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 11, fontFamily: "Helvetica", color: "#111827" },
  strip: { height: 8, backgroundColor: "#f4b400", marginBottom: 24 },
  company: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#f4b400" },
  title: { fontSize: 12, marginTop: 2, color: "#6b7280" },
  banner: {
    marginTop: 18,
    padding: 14,
    borderRadius: 6,
    backgroundColor: "#fff3cd",
  },
  bannerTitle: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  bannerSub: { fontSize: 10, color: "#6b7280", marginTop: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginTop: 20 },
  cell: { width: "50%", marginBottom: 16, paddingRight: 12 },
  label: { fontSize: 9, color: "#6b7280", marginBottom: 3 },
  value: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  footer: {
    position: "absolute",
    left: 36,
    right: 36,
    bottom: 28,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    fontSize: 9,
    color: "#9ca3af",
    textAlign: "center",
  },
});

function Cell({ label, value }) {
  return (
    <View style={styles.cell}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export default function InternStipendSlipPDF({ row }) {
  return (
    <Document title={`Stipend Slip - ${row.month_label}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.strip} />

        <Text style={styles.company}>Vsoft Solution</Text>
        <Text style={styles.title}>Stipend Slip - {row.month_label}</Text>

        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Intern Stipend Slip</Text>
          <Text style={styles.bannerSub}>Vsoft Solution</Text>
        </View>

        <View style={styles.grid}>
          <Cell label="Intern Name" value={row.intern_name || "-"} />
          <Cell label="Intern ID" value={row.intern_code || "-"} />
          <Cell label="Department" value={row.department_name || "-"} />
          <Cell label="Position" value={row.designation || "-"} />
          <Cell label="Stipend Month" value={row.month_label} />
          <Cell label="Monthly Stipend" value={formatAmount(row.amount)} />
          <Cell
            label="Payment Date"
            value={row.paid_date ? String(row.paid_date).slice(0, 10) : "-"}
          />
          <Cell label="Payment Status" value={row.status} />
          {row.reference ? <Cell label="Reference" value={row.reference} /> : null}
        </View>

        <Text style={styles.footer}>
          This is a system-generated stipend slip and does not require a signature.
        </Text>
      </Page>
    </Document>
  );
}