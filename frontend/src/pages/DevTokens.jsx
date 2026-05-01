import React from 'react';

const DevTokens = () => {
  return (
    <div className="p-12 space-y-12">
      <header>
        <p className="text-label text-fg-tertiary mb-2">System Check</p>
        <h1 className="text-display-lg">Design Tokens</h1>
      </header>

      <section className="space-y-6">
        <h2 className="text-h2">Surfaces & Cards</h2>
        <div className="glass-card p-8 max-w-md">
          <p className="text-label text-fg-tertiary mb-4">Card Header</p>
          <h3 className="text-display-sm mb-2">Glass Surface</h3>
          <p className="text-body text-fg-secondary">
            This card uses the glass-card component with a subtle gradient and border.
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-h2">Typography</h2>
        <div className="space-y-4">
          <p className="text-display-hero">Display Hero</p>
          <p className="text-display-lg">Display Large</p>
          <p className="text-display-md">Display Medium (1234.56)</p>
          <p className="text-display-sm">Display Small</p>
          <p className="text-h1">Heading 1</p>
          <p className="text-h2">Heading 2</p>
          <p className="text-h3">Heading 3</p>
          <p className="text-body-lg">Body Large</p>
          <p className="text-body">Body Default</p>
          <p className="text-body-sm">Body Small</p>
          <p className="text-caption">Caption Text</p>
          <p className="text-label">Label Text</p>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-h2">Interactive Elements</h2>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-2">
            <label className="text-label text-fg-secondary">Sample Input</label>
            <input 
              type="text" 
              placeholder="Enter something..." 
              className="bg-surface-inset border border-border-default rounded-md px-4 py-2 text-fg-primary focus:outline-none focus:border-accent-glow focus:ring-2 focus:ring-accent-glow/20 h-11 w-64"
            />
          </div>
          <button className="bg-fg-primary text-void px-5 py-2.5 rounded-md font-medium hover:bg-fg-primary/90 transition-colors h-11">
            Primary Action
          </button>
          <button className="bg-surface-raised border border-border-default text-fg-primary px-5 py-2.5 rounded-md font-medium hover:bg-surface-raised/80 transition-colors h-11">
            Secondary
          </button>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-h2">Status Pills</h2>
        <div className="flex gap-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-success-bg text-success border border-success-border">
            <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
            Present
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-danger-bg text-danger border border-danger-border">
            <span className="w-1.5 h-1.5 rounded-full bg-danger"></span>
            Absent
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-warning-bg text-warning border border-warning-border">
            Pending
          </span>
        </div>
      </section>
    </div>
  );
};

export default DevTokens;
