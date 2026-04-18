import './globals.css';

export const metadata = {
  title: 'ClauseWatch – AI Contract Scanner',
  description: 'Paste any contract. ClauseWatch flags unfair clauses and explains them in plain English.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}