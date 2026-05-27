# Maintainer: Your Name <your.email@example.com>
pkgname=focusboard
pkgver=0.1.0
pkgrel=1
pkgdesc="Automatic activity tracking and focus analytics desktop app"
arch=('x86_64')
url="https://github.com/anuruprkris/FocusBoard"
license=('MIT')
depends=(
  'nodejs>=18.0.0'
  'python>=3.11'
  'python-pip'
  'rust'
  'cargo'
  'gtk3'
  'webkit2gtk-4.1'
  'libappindicator-gtk3'
  'libsoup3'
  'glib-networking'
)
makedepends=(
  'npm'
  'bun'
  'git'
)
source=("$pkgname-$pkgver.tar.gz")
sha256sums=('SKIP')

build() {
  cd "$srcdir/$pkgname-$pkgver"
  
  # Build Tauri desktop app
  cd FocusBoard
  npm install
  npm run tauri build
  cd ..
  
  # Install backend dependencies
  cd FocusBoard-backend
  npm install --production
  cd ..
  
  # Install ML service dependencies
  cd ml-service
  python -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
  deactivate
  cd ..
}

package() {
  cd "$srcdir/$pkgname-$pkgver"
  
  # Install desktop app binary
  install -Dm755 "FocusBoard/src-tauri/target/release/focusboard" "$pkgdir/usr/bin/focusboard-bin"
  
  # Install launcher script
  install -Dm755 "$srcdir/focusboard-launcher.sh" "$pkgdir/usr/bin/focusboard"
  
  # Install backend
  install -dm755 "$pkgdir/usr/share/focusboard/backend"
  cp -r FocusBoard-backend/* "$pkgdir/usr/share/focusboard/backend/"
  
  # Install ML service
  install -dm755 "$pkgdir/usr/share/focusboard/ml-service"
  cp -r ml-service/* "$pkgdir/usr/share/focusboard/ml-service/"
  
  # Install systemd user services
  install -Dm644 "$srcdir/focusboard-backend.service" "$pkgdir/usr/lib/systemd/user/focusboard-backend.service"
  install -Dm644 "$srcdir/focusboard-ml.service" "$pkgdir/usr/lib/systemd/user/focusboard-ml.service"
  
  # Install desktop entry
  install -Dm644 "$srcdir/focusboard.desktop" "$pkgdir/usr/share/applications/focusboard.desktop"
  
  # Install AppStream metadata
  install -Dm644 "$srcdir/focusboard.appdata.xml" "$pkgdir/usr/share/metainfo/focusboard.appdata.xml"
  
  # Install icons
  install -Dm644 FocusBoard/src-tauri/icons/32x32.png "$pkgdir/usr/share/icons/hicolor/32x32/apps/focusboard.png"
  install -Dm644 FocusBoard/src-tauri/icons/128x128.png "$pkgdir/usr/share/icons/hicolor/128x128/apps/focusboard.png"
  install -Dm644 FocusBoard/src-tauri/icons/focusboard.svg "$pkgdir/usr/share/icons/hicolor/scalable/apps/focusboard.svg"
  
  # Install license
  install -Dm644 LICENSE "$pkgdir/usr/share/licenses/$pkgname/LICENSE"
}
