interface FooterProps {
  note?: string
}

export default function Footer({
  note = 'EOF · ⌃C to exit · not investment advice',
}: FooterProps) {
  return (
    <div
      style={{
        marginTop: 40,
        paddingTop: 16,
        borderTop: '1px dashed var(--border)',
        fontSize: 11,
        color: 'var(--faint)',
        display: 'flex',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      <span>{note}</span>
      <span>dcaify.com · binance daily closes · open source</span>
    </div>
  )
}
