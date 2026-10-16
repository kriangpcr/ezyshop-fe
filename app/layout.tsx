import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EzyShop — Gaming Store & Codes',
  description: 'ศูนย์รวมโค้ดเกมและไอดีเกม พร้อมส่งอัตโนมัติ 24 ชั่วโมง',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body>{children}</body></html>;
}
