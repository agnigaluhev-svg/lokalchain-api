import { BrandMark } from './Brand.jsx'
import { IconArrowLeft, IconLogout } from './Icons.jsx'

const ROLE_LABEL = {
  admin: 'Admin',
  kud: 'KUD / Koperasi',
  produsen: 'Produsen',
  umkm: 'UMKM',
}

function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'LC'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

/**
 * Kerangka aplikasi responsif.
 * Mobile: topbar ringkas + bottom dock.
 * Desktop (≥1024px): rail kiri permanen + kanvas konten lebar.
 */
export default function Shell({
  user,
  items = [],
  active,
  onNavigate,
  onLogout,
  onExit,
  exitLabel = 'Kembali',
  title,
  subtitle,
  topbarExtra,
  note,
  children,
  pageClass = '',
  navLabel = 'Navigasi utama',
}) {
  const role = user?.role || 'umkm'
  const hasNav = items.length > 0

  return (
    <div className="app">
      <aside className="rail" aria-label="Navigasi aplikasi">
        <div className="rail-brand">
          <BrandMark size={38} />
          <div className="rail-brand-text">
            <span className="rail-brand-name">LokalChain</span>
            <span className="rail-brand-sub">DSS Platform</span>
          </div>
        </div>

        <div className="rail-profile">
          <div className="avatar" aria-hidden="true">{initials(user?.name)}</div>
          <div className="rail-profile-text">
            <span className="rail-profile-name">{user?.name || 'Pengguna'}</span>
            <span className={`rail-role ${role}`}>{ROLE_LABEL[role] || role}</span>
          </div>
        </div>

        {hasNav && (
          <nav className="rail-nav" aria-label={navLabel}>
            {items.map(({ id, label, icon: Icon, count }) => (
              <button
                key={id}
                type="button"
                className={`rail-nav-item ${active === id ? 'active' : ''}`}
                onClick={() => onNavigate?.(id)}
                aria-current={active === id ? 'page' : undefined}
              >
                <Icon size={18} />
                <span>{label}</span>
                {count != null && count > 0 && <span className="rail-count">{count}</span>}
              </button>
            ))}
          </nav>
        )}

        <div className="rail-foot">
          <p className="rail-note">
            {note || 'Data produsen contoh adalah simulasi dan harga impor hanya angka referensi.'}
          </p>
          <button type="button" className="rail-logout" onClick={onLogout}>
            <IconLogout size={16} /> Keluar
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="topbar-brand">
            {onExit && (
              <button
                type="button"
                className={`topbar-exit ${hasNav ? '' : 'md-hide'}`}
                onClick={onExit}
                aria-label={exitLabel}
                title={exitLabel}
              >
                <IconArrowLeft size={18} />
              </button>
            )}
            <BrandMark size={30} className="topbar-mark" />
            <div className="topbar-titles">
              <div className="topbar-title">{title}</div>
              {subtitle && <div className="topbar-sub">{subtitle}</div>}
            </div>
          </div>
          {topbarExtra && <div className="topbar-right">{topbarExtra}</div>}
        </header>

        <main className={`page ${pageClass}`.trim()}>{children}</main>
      </div>

      {hasNav && (
        <nav className="bottom-nav" aria-label={navLabel}>
          {items.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`nav-item ${active === id ? 'active' : ''}`}
              onClick={() => onNavigate?.(id)}
              aria-current={active === id ? 'page' : undefined}
            >
              <Icon size={19} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}

export { ROLE_LABEL as SHELL_ROLE_LABEL }
