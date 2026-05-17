'use client'

import { PortableText, type PortableTextComponents } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/react'
import Image from 'next/image'

interface Props {
  body: PortableTextBlock[]
}

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="text-[var(--text-dim)] leading-relaxed mb-5">{children}</p>
    ),
    h2: ({ children }) => (
      <h2 className="[font-family:var(--font-serif)] text-2xl sm:text-3xl text-[var(--text)] mt-10 mb-4 leading-tight">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl font-semibold text-[var(--text)] mt-8 mb-3">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-base font-semibold text-[var(--text)] mt-6 mb-2">{children}</h4>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-[var(--accent)] pl-4 my-6 text-[var(--text-dim)] italic">
        {children}
      </blockquote>
    ),
  },
  marks: {
    strong: ({ children }) => (
      <strong className="font-semibold text-[var(--text)]">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="px-1.5 py-0.5 rounded bg-[var(--surface-raised)] text-[var(--accent)] text-sm font-mono">
        {children}
      </code>
    ),
    link: ({ value, children }) => (
      <a
        href={value?.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[var(--accent)] underline underline-offset-2 hover:opacity-80 transition-opacity"
      >
        {children}
      </a>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc list-inside space-y-1.5 mb-5 text-[var(--text-dim)]">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal list-inside space-y-1.5 mb-5 text-[var(--text-dim)]">{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li className="leading-relaxed">{children}</li>,
    number: ({ children }) => <li className="leading-relaxed">{children}</li>,
  },
  types: {
    image: ({ value }: { value: { asset?: { url?: string }; alt?: string } }) => {
      const url = value?.asset?.url
      if (!url) return null
      return (
        <div className="my-8 rounded-xl overflow-hidden border border-[var(--border)]">
          <Image
            src={url}
            alt={value.alt ?? ''}
            width={800}
            height={450}
            className="w-full h-auto object-cover"
          />
        </div>
      )
    },
    codeBlock: ({ value }: { value: { code?: string; language?: string } }) => (
      <pre className="my-6 p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] overflow-x-auto">
        <code className="text-sm font-mono text-[var(--accent)] whitespace-pre">
          {value.code}
        </code>
      </pre>
    ),
  },
}

export function BlogContent({ body }: Props) {
  return (
    <div className="blog-content">
      <PortableText value={body} components={components} />
    </div>
  )
}
