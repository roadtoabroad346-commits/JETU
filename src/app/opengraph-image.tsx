import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: 72,
        background: '#008bdf',
        color: '#041a2e',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: 88,
          fontWeight: 800,
          color: '#ffb500',
          letterSpacing: -5,
        }}
      >
        JETU
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div
          style={{
            display: 'flex',
            fontSize: 55,
            fontWeight: 700,
            lineHeight: 1.1,
          }}
        >
          A clearer path to international education.
        </div>
        <div style={{ display: 'flex', fontSize: 26 }}>
          JETU Admissions · Central Asia
        </div>
      </div>
    </div>,
    size,
  );
}
