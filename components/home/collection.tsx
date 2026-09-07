'use client';
import PageLink from '@/components/page-link';
import { useState } from 'react';
import Image from 'next/image';
import { ArrowUpRight, Box, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { experiences } from '@/lib/experiences';
export default function Collection() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches = experiences.filter(
    (item) =>
      (category === 'All' || item.category === category) &&
      terms.every((term) =>
        (
          item.title +
          ' ' +
          item.description +
          ' ' +
          item.keywords +
          ' ' +
          item.category
        )
          .toLowerCase()
          .includes(term),
      ),
  );
  function clear() {
    setQuery('');
    setCategory('All');
  }
  return (
    <section
      id="explore"
      className="home-container home-library"
      aria-labelledby="collection-title"
    >
      <div className="collection-heading">
        <div>
          <p className="home-eyebrow">THE COLLECTION</p>
          <h2 id="collection-title">Find your next “aha.”</h2>
        </div>
        <p>Big questions. Hands-on answers.</p>
      </div>
      <Tabs
        value={category}
        onValueChange={setCategory}
        className="collection-tabs"
      >
        <div className="collection-tools">
          <TabsList aria-label="Experience categories">
            {['All', 'Engines', 'Vehicles'].map((value) => (
              <TabsTrigger value={value} key={value}>
                {value === 'All' ? 'All experiences' : value}
                <span>
                  {value === 'All'
                    ? experiences.length
                    : experiences.filter((item) => item.category === value)
                        .length}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="collection-search">
            <Search size={16} />
            <Input
              aria-label="Search experiences"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search your curiosity…"
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery('')}
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
        <output className="sr-only">
          {matches.length} {matches.length === 1 ? 'experience' : 'experiences'}{' '}
          found
        </output>
        <TabsContent value={category} className="collection-panel">
          <div className="experience-grid">
            {matches.map((item) => (
              <PageLink
                href={item.href}
                className={`experience-card experience-${item.id}`}
                key={item.id}
              >
                <div className="experience-image">
                  <Image
                    unoptimized
                    src={item.image}
                    alt={item.alt}
                    loading="lazy"
                    width="1200"
                    height="650"
                  />
                  <span className="experience-format">
                    <Box size={12} /> Interactive 3D
                  </span>
                  <span className="experience-launch" aria-hidden="true">
                    <ArrowUpRight size={23} />
                  </span>
                </div>
                <div className="experience-content">
                  <div className="experience-kicker">
                    <span>{item.category}</span>
                    <span>EXPLORATION {item.number}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <div className="experience-bottom">
                    <span>{item.detail}</span>
                    <ArrowUpRight size={17} />
                  </div>
                </div>
              </PageLink>
            ))}
          </div>
          {!matches.length && (
            <div className="collection-empty">
              <Search size={28} />
              <h3>No experiences found.</h3>
              <p>Try “engine”, “car”, or a system like “cooling”.</p>
              <button type="button" onClick={clear}>
                Show all experiences <ArrowUpRight size={16} />
              </button>
            </div>
          )}
        </TabsContent>
      </Tabs>
      <p className="collection-note">
        <span /> A growing collection. A little more of the world, explained.
      </p>
    </section>
  );
}
