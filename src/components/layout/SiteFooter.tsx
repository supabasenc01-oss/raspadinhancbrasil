import { Link } from "@tanstack/react-router";

import { BrandLogo } from "./SiteHeader";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/70 bg-surface/40">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <BrandLogo />
          <p className="max-w-xs text-sm text-muted-foreground">
            Plataforma de raspadinhas online com experiência premium, transparência e prêmios
            auditáveis.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Plataforma</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/raspadinhas" className="transition-colors hover:text-foreground">
                Raspadinhas
              </Link>
            </li>
            <li>
              <Link to="/ganhadores" className="transition-colors hover:text-foreground">
                Ganhadores
              </Link>
            </li>
            <li>
              <Link to="/como-funciona" className="transition-colors hover:text-foreground">
                Como funciona
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Suporte</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/faq" className="transition-colors hover:text-foreground">
                Central de Ajuda & FAQ
              </Link>
            </li>
            <li>
              <Link to="/suporte" className="transition-colors hover:text-foreground">
                Suporte Técnico
              </Link>
            </li>
            <li>
              <Link to="/como-jogar" className="transition-colors hover:text-foreground">
                Como Jogar
              </Link>
            </li>
            <li>
              <Link to="/termos" className="transition-colors hover:text-foreground">
                Termos de uso
              </Link>
            </li>
            <li>
              <Link to="/privacidade" className="transition-colors hover:text-foreground">
                Privacidade
              </Link>
            </li>
            <li>
              <Link to="/jogo-responsavel" className="transition-colors hover:text-foreground">
                Jogo Responsável
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Jogo responsável</h3>
          <p className="text-sm text-muted-foreground">
            Conteúdo destinado a maiores de 18 anos. Jogue com responsabilidade e defina limites.
          </p>
        </div>
      </div>

      <div className="border-t border-border/70 px-4 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} RaspaPremium. Todos os direitos reservados.
      </div>
    </footer>
  );
}
