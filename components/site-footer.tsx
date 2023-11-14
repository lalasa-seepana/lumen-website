import { Arrow } from "@/components/icons";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <a href="#welcome" className="footer-brand">
          lumen<span>✳︎</span>
        </a>
        <p>Beauty and care. A demonstration only.</p>
        <a href="#main" className="back-to-top" aria-label="Back to top">
          <Arrow diagonal />
        </a>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Lumen. A demonstration project.</p>
      </div>
    </footer>
  );
}
