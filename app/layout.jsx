import './globals.css';

export const metadata = {
  title: 'Valygo Assistant',
  description: 'Voice assistant',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
