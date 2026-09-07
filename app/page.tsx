import PageLink from '@/components/page-link';
import {
  ArrowDown,
  ArrowUpRight,
  Box,
  Layers3,
  MousePointer2,
  Rotate3D,
} from 'lucide-react';
import Brand, { BrandMark } from '@/components/brand';
import EnginePreview from '@/components/home/engine-preview';
import Collection from '@/components/home/collection';
import './home.css';
export default function Home() {
  return (
    <div className="home-page">
      <PageLink className="home-skip" href="#main">
        Skip to content
      </PageLink>
      <header className="home-header home-container">
        <PageLink href="/" aria-label="How Things Click home">
          <Brand />
        </PageLink>
        <nav aria-label="Main navigation">
          <PageLink href="#explore">Explore</PageLink>
          <PageLink href="#about">The idea</PageLink>
        </nav>
        <PageLink className="header-lab" href="/engine">
          Open engine lab <ArrowUpRight size={16} />
        </PageLink>
      </header>
      <main id="main">
        <section className="home-hero home-container">
          <div className="hero-copy">
            <p className="home-eyebrow">
              <span /> FOR THE CURIOUS
            </p>
            <h1>
              See what makes
              <br />
              the world <em>click.</em>
            </h1>
            <p className="hero-description">
              Go beyond the outside. Explore interactive 3D worlds, take things
              apart, and discover how it all works.
            </p>
            <div className="hero-actions">
              <PageLink className="home-button" href="/engine">
                Explore the engine <ArrowUpRight size={19} />
              </PageLink>
              <PageLink className="hero-browse" href="#explore">
                Browse experiences <ArrowDown size={17} />
              </PageLink>
            </div>
            <p className="hero-note">
              Made to be explored. No download needed.
            </p>
          </div>
          <EnginePreview />
        </section>
        <div
          className="home-principles home-container"
          aria-label="Ways to explore"
        >
          <span>
            <Rotate3D /> A new angle on everything
          </span>
          <span>
            <Layers3 /> Take it apart, piece by piece
          </span>
          <span>
            <MousePointer2 /> You’re in control
          </span>
          <span>
            <Box /> Right in your browser
          </span>
        </div>
        <Collection />
        <section
          id="about"
          className="home-about home-container"
          aria-labelledby="about-title"
        >
          <div className="about-intro">
            <p className="home-eyebrow">LESS WATCHING. MORE WONDERING.</p>
            <h2 id="about-title">
              Some things make
              <br />
              more sense when
              <br />
              <em>you can touch them.</em>
            </h2>
            <p>
              A diagram shows you where things are. An interactive lets you
              discover why they work. That moment when it comes together? That’s
              the click.
            </p>
            <PageLink href="#explore">
              Follow your curiosity <ArrowUpRight size={19} />
            </PageLink>
          </div>
          <div className="about-steps">
            <div>
              <span>01</span>
              <section>
                <h3>Look a little closer.</h3>
                <p>
                  Turn it around. Zoom in. Find the detail you’ve never noticed
                  before.
                </p>
              </section>
              <Rotate3D />
            </div>
            <div>
              <span>02</span>
              <section>
                <h3>See the connections.</h3>
                <p>
                  Separate the parts and follow the systems that make them work
                  together.
                </p>
              </section>
              <Layers3 />
            </div>
            <div>
              <span>03</span>
              <section>
                <h3>Try “what if?”</h3>
                <p>
                  Change the throttle. Follow the flow. Let your next question
                  lead the way.
                </p>
              </section>
              <MousePointer2 />
            </div>
          </div>
          <BrandMark className="about-watermark" />
        </section>
      </main>
      <footer className="home-footer home-container">
        <PageLink href="/" aria-label="How Things Click home">
          <Brand />
        </PageLink>
        <span>© 2026 How Things Click. Stay curious.</span>
        <nav aria-label="Footer navigation">
          <PageLink href="/engine">
            Engine lab <ArrowUpRight size={14} />
          </PageLink>
          <PageLink href="/car">
            Whole car <ArrowUpRight size={14} />
          </PageLink>
        </nav>
      </footer>
    </div>
  );
}
